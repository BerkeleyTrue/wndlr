// @flow
import createDebugger from 'debug';
import dedent from 'dedent';
import moment from 'moment';
import { aql } from 'arangojs';
import { forkJoin, merge, type Observable } from 'rxjs';
import { normalizeEmail } from 'validator';
import { pluck, partition, tap, switchMap, map, mapTo } from 'rxjs/operators';

import * as User from './User.js';
import renderUserSignInMail from './user-sign-in.js';
import renderUserSignUpMail from './user-sign-up.js';
import {
  typeof queryOne as QueryOne,
  typeof query as Query,
} from '../Data-Source';
import { typeof sendMail as SendMail, authUtils } from '../utils';

const log = createDebugger('wndlr:server:Models:UserAuthentication');
const createWaitMessage = (timeTillAuthReset: number) => dedent`
Please wait at least ${timeTillAuthReset} minute${
  timeTillAuthReset > 1 ? 's' : ''
} for the sign in email to arrive
  before requesting a new one.
`;
export const ttl15Min = 15 * 60 * 1000;
export const authResetTime = 5;

export const gqlType = `
  """
  User Authentication Document:
  Relates to a user who is attempting to sign in or sign up.
  """
  type AuthenToken {
    token: String
    ttl: Int
    createdOn: Int
  }
`;

export type AuthenToken = {
  ttl: number,
  token: string,
  createdOn: number,
};

const pluckCreatedOn = ({ createdOn }) => createdOn;
const createResetMoment = () => moment().subtract(authResetTime, 'm');

export const isAuthRecent = (auth: AuthenToken): boolean =>
  moment(pluckCreatedOn(auth)).isAfter(createResetMoment());

export const getWaitTime = (auth: AuthenToken): number =>
  moment
    .duration(moment(pluckCreatedOn(auth)).diff(createResetMoment()))
    .minutes();

export const createToken = (): Observable<AuthenToken> =>
  authUtils.generateVerificationToken().pipe(
    map(token => ({
      token,
      ttl: ttl15Min,
      createdOn: Date.now(),
    })),
  );

export const internals = {
  queryUserNAuth: (queryOne: QueryOne, email: string) =>
    queryOne(
      aql`
        LET user = First(
          FOR user IN users
            FILTER user.normalizedEmail == ${email}
            LIMIT 1
            RETURN user
        )

        LET auth = !IS_NULL(user) ? FIRST(
          FOR auth
            IN 1..1
            OUTBOUND user._id
            userToAuthentication
              RETURN auth
        ) : NULL

        RETURN { user, auth }
      `,
    ),
  createUserAndAuth: (
    queryOne: QueryOne,
    email: string,
    noUser: Observable<*>,
  ) =>
    noUser.pipe(
      switchMap(() => forkJoin(User.createNewUser(email), createToken())),
      switchMap(([
        user,
        auth,
      ]) =>
        queryOne(
          aql`
            // create user and authen
            INSERT ${user} INTO users

            // store new user
            LET user = NEW

            INSERT ${auth} INTO userAuthentications

            // store new doc
            LET auth = NEW

            // create edge to user
            INSERT {
              _from: user._id,
              _to: auth._id
            } INTO userToAuthentication
          `,
          // $FlowFixMe
        ).pipe(mapTo({ token: auth.token, guid: user.guid, isSignUp: true })),
      ),
      tap(() => log('new user')),
    ),
  createAuthForUser: (
    queryOne: QueryOne,
    userExistsHasNoAuth: Observable<*>,
  ): Observable<*> =>
    userExistsHasNoAuth.pipe(
      switchMap(({ user }) =>
        createToken().pipe(
          switchMap(auth =>
            queryOne(
              aql`
              // create authen
              INSERT ${auth} INTO userAuthentications

              // store new doc
              LET auth = NEW

              // create edge to user
              INSERT {
                _from: ${user._id},
                _to: auth._id
              } INTO userToAuthentication
            `,
            ).pipe(
              mapTo({
                token: auth.token,
                guid: user.guid,
                isSignUp: false,
              }),
            ),
          ),
          tap(() => log('user exists, has no auth')),
        ),
      ),
    ),
  deleteAndCreateNewAuthForUser: (
    query: Query,
    queryOne: QueryOne,
    userExistsHasOutdatedAuth: Observable<*>,
  ) =>
    userExistsHasOutdatedAuth.pipe(
      switchMap(({ user, auth }) =>
        queryOne(
          aql`
          WITH userAuthentications, userToAuthentication

          LET authEdges = (
            FOR v, e
              IN 1..1
              INBOUND ${auth._id}
              GRAPH 'userSignInAttempt'
                REMOVE e IN userToAuthentication
          )

          REMOVE { "_key": ${auth._key} } IN userAuthentications
        `,
        ).pipe(
          switchMap(() =>
            createToken().pipe(
              switchMap(auth =>
                query(
                  aql`
                  // create new authen
                  INSERT ${auth} INTO userAuthentications

                  // store new doc
                  LET auth = NEW

                  // create edge to user
                  INSERT {
                    _from: ${user._id},
                    _to: auth._id
                  } INTO userToAuthentication
                `,
                ).pipe(
                  mapTo({
                    token: auth.token,
                    guid: user.guid,
                    isSignUp: false,
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
      tap(() => log('user exists, has old auth')),
    ),
};

// find user with normalized(email)
// if no user, create one
// if user has token and token ttl is live
//   return wait message
// else
//   create token
//     ttl (15 min)
//     created: Date
//     token: guid
//   encode emailj
//   send email
//   return message
export const sendSignInEmail = (
  url: string,
  sendMail: SendMail,
  query: Query,
  queryOne: QueryOne,
) => (root: any, { email }: { email: string }) => {
  const queryUserNAuth = internals.queryUserNAuth(
    queryOne,
    normalizeEmail(email),
  );

  const [
    userExists,
    noUser,
  ] = partition(({ user }) => !!user)(queryUserNAuth);

  const [
    userExistsHasOldAuth,
    userExistsHasNoAuth,
  ] = partition(
    ({ auth }) => !!auth,
  )(userExists);

  const [
    userExistsAndHasRecentAuth,
    userExistsHasOutdatedAuth,
  ] = partition(
    ({ auth }) => isAuthRecent(auth),
  )(userExistsHasOldAuth);

  const createUserAndAuth = internals.createUserAndAuth(
    queryOne,
    email,
    noUser,
  );

  const createAuthForUser = internals.createAuthForUser(
    queryOne,
    userExistsHasNoAuth,
  );

  const sendWaitMessage = userExistsAndHasRecentAuth.pipe(
    pluck('auth'),
    map(getWaitTime),
    map(createWaitMessage),
    map(message => ({ message })),
    tap(() => log('user exists has recent auth')),
  );

  const deleteAndCreateNewAuthForUser = internals.deleteAndCreateNewAuthForUser(
    query,
    queryOne,
    userExistsHasOutdatedAuth,
  );

  return merge(
    sendWaitMessage,
    merge(
      createUserAndAuth,
      createAuthForUser,
      deleteAndCreateNewAuthForUser,
    ).pipe(
      switchMap(({ guid, token, isSignUp }) => {
        const renderText = isSignUp ?
          renderUserSignUpMail :
          renderUserSignInMail;
        return sendMail({
          to: email,
          subject: 'sign in',
          text: renderText({
            token,
            guid,
            url,
          }),
        });
      }),
      tap(emailInfo => console.log('emailInfo: ', emailInfo)),
      // sign in link sent
      // send message to client app
      map(() => ({
        message: dedent`
          We found your existing account.
          Check your email and click the sign in link we sent you.
        `,
      })),
    ),
  ).toPromise();
};
