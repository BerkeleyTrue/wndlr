// @flow
import type { $Application } from 'express';
import _ from 'lodash/fp';
import moment from 'moment';
import createDebugger from 'debug';
import dedent from 'dedent';
import { Observable } from 'rxjs';
import { normalizeEmail } from 'validator';
import { aql } from 'arangojs';

import renderUserSignInMail from './user-sign-in.js';
import renderUserSignUpMail from './user-sign-up.js';
import { sendMail, authUtils } from '../../utils';
import { dataSource as ds } from '../../data-source';

const ttl15Min = 15 * 60 * 1000;
const authResetTime = 5;
const log = createDebugger('wndlr:server:controllers:graphql');

const timestampToMoment = _.flow(x => new Date(x), moment);
const isAuthRecent = (createdOn: number) =>
  timestampToMoment(createdOn).isAfter(moment().subtract(authResetTime, 'm'));

const getWaitTime = _.flow(
  timestampToMoment,
  createdOn => createdOn.diff(moment().subtract(authResetTime, 'm')),
  moment.duration,
  _.method('minutes'),
);

const createWaitMessage = (timeTillAuthReset: number) => dedent`
  Please wait at least ${timeTillAuthReset} minute${
  timeTillAuthReset > 1 ? 's' : ''
} for the sign in email to arrive
  before requesting a new one.
`;

export const typeDefs = `
  """
  User Document:
  """
  type User {
    """
    Used to send emails
    """
    email: Email

    """
    Used to identify a user
    """
    normalizedEmail: NormalizedEmail

    isEmailVerified: Boolean

    """
    Used to find a user from an unsubscribe link
    """
    guid: String

    created: Int
    lastUpdated: Int
  }

  """
  Authentication Document:
  Relates to a user who is attempting to sign in or sign up.
  """
  type UserSignIn {
    token: String
    ttl: Int
    created: Int
  }

  type Info {
    message: String
  }

  type Mutation {
    sendSignInEmail(email: Email): Info
  }
`;

export const makeResolvers = function(app: $Application) {
  return {
    Mutation: {
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
      sendSignInEmail: (root: any, { email }: { email: string }) => {
        const normalizedEmail = normalizeEmail(email);
        // check if the user already exists
        log('normalizedEmail: ', normalizedEmail);
        const queryUserNAuth = ds.queryOne(
          aql`
              LET user = First(
                FOR user IN users
                  FILTER user.normalizedEmail == ${normalizedEmail}
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
        );

        const [
          userExists,
          noUser,
        ] = queryUserNAuth.partition(
          ({ user }) => !!user,
        );

        const [
          userExistsHasOldAuth,
          userExistsHasNoAuth,
        ] = userExists.partition(({ auth }) => !!auth);

        const [
          userExistsAndHasRecentAuth,
          userExistsHasOutdatedAuth,
        ] = userExistsHasOldAuth.partition(({ auth: { createdOn } }) =>
          isAuthRecent(createdOn),
        );

        const createUserAndAuth = noUser
          .switchMap(() =>
            Observable.forkJoin(
              authUtils.generateVerificationToken(),
              authUtils.createToken(ttl15Min),
            ),
          )
          .switchMap(([
            guid,
            auth,
          ]) =>
            ds
              .queryOne(
                aql`
                  // create user and authen
                  INSERT {
                    email: ${email},
                    normalizedEmail: ${normalizedEmail},
                    createdOn: ${Date.now()},
                    lastUpdatedOn: ${Date.now()},
                    guid: ${guid}
                  } INTO users

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
              )
              .mapTo({ token: auth.token, guid, isSignUp: true }),
          )
          .do(() => log('new user'));

        const createAuthForUser = userExistsHasNoAuth
          .switchMap(({ user }) =>
            authUtils.createToken(ttl15Min).switchMap(auth =>
              ds
                .queryOne(
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
                )
                .mapTo({ token: auth.token, guid: user.guid, isSignUp: false }),
            ),
          )
          .do(() => log('user exists, has no auth'));

        const sendWaitMessage = userExistsAndHasRecentAuth
          .pluck('auth', 'createdOn')
          .map(getWaitTime)
          .map(createWaitMessage)
          .map(message => ({ message }))
          .do(() => log('user exists has recent auth'));

        const deleteAndCreateNewAuthForUser = userExistsHasOutdatedAuth
          .switchMap(({ user, auth }) =>
            ds
              .queryOne(
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
              )
              .switchMap(() =>
                authUtils.createToken(ttl15Min).switchMap(auth =>
                  ds
                    .query(
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
                    )
                    .mapTo({
                      token: auth.token,
                      guid: user.guid,
                      isSignUp: false,
                    }),
                ),
              ),
          )
          .do(() => log('user exists, has old auth'));

        return Observable.merge(
          sendWaitMessage,
          Observable.merge(
            createUserAndAuth,
            createAuthForUser,
            deleteAndCreateNewAuthForUser,
          )
            .map(({ isSignUp, ...args }) => ({
              ...args,
              renderText: isSignUp ?
                renderUserSignUpMail :
                renderUserSignInMail,
            }))
            .switchMap(({ guid, token, renderText }) =>
              sendMail({
                to: email,
                subject: 'sign in',
                text: renderText({
                  token,
                  guid: guid,
                  url: app.get('url'),
                }),
              }),
            )
            .do(emailInfo => console.log('emailInfo: ', emailInfo))
            // sign in link sent
            // send message to client app
            .map(() => ({
              message: dedent`
                We found your existing account.
                Check your email and click the sign in link we sent you.
              `,
            })),
        ).toPromise();
      },
    },
  };
};
