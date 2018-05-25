// @flow
import R from 'ramda';
import dedent from 'dedent';
import { aql } from 'arangojs';
import createDebugger from 'debug';
import { forkJoin, merge } from 'rxjs';
import { pluck, partition, tap, switchMap, map, mapTo } from 'rxjs/operators';
import { normalizeEmail } from 'validator';
import type { $Application } from 'express';

import renderUserSignInMail from './user-sign-in.js';
import renderUserSignUpMail from './user-sign-up.js';
import { User, UserAuthentication as UserAuthen } from '../Models';
import { sendMail } from '../utils';
import { dataSource as ds } from '../Data-Source';

const log = createDebugger('wndlr:server:controllers:graphql');

const createWaitMessage = (timeTillAuthReset: number) => dedent`
  Please wait at least ${timeTillAuthReset} minute${
  timeTillAuthReset > 1 ? 's' : ''
} for the sign in email to arrive
  before requesting a new one.
`;

export const typeDefs = `
  ${User.gqlType}

  ${UserAuthen.gqlType}

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
        ] = partition(R.pipe(R.pluck('user'), Boolean))(queryUserNAuth);

        const [
          userExistsHasOldAuth,
          userExistsHasNoAuth,
        ] = partition(R.pipe(R.pluck('auth'), Boolean))(userExists);

        const [
          userExistsAndHasRecentAuth,
          userExistsHasOutdatedAuth,
        ] = partition(R.pipe(R.prop('auth'), UserAuthen.isAuthRecent))(userExistsHasOldAuth);

        const createUserAndAuth = noUser.pipe(
          switchMap(() =>
            forkJoin(
              User.createNewUser(email),
              UserAuthen.createToken()
            )
          ),
          switchMap(([
            user,
            auth,
          ]) =>
            ds
              .queryOne(
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
              )
              .pipe(
                mapTo({ token: auth.token, guid: user.guid, isSignUp: true }),
              ),
          ),
          tap(() => log('new user')),
        );

        const createAuthForUser = userExistsHasNoAuth.pipe(
          switchMap(({ user }) =>
            UserAuthen.createToken().pipe(
              switchMap(auth =>
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
                  .pipe(
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
        );

        const sendWaitMessage = userExistsAndHasRecentAuth.pipe(
          pluck('auth'),
          map(UserAuthen.getWaitTime),
          map(createWaitMessage),
          map(message => ({ message })),
          tap(() => log('user exists has recent auth')),
        );

        const deleteAndCreateNewAuthForUser = userExistsHasOutdatedAuth.pipe(
          switchMap(({ user, auth }) =>
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
              .pipe(
                switchMap(() =>
                  UserAuthen.createToken().pipe(
                    switchMap(auth =>
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
                        .pipe(
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
        );

        return merge(
          sendWaitMessage,
          merge(
            createUserAndAuth,
            createAuthForUser,
            deleteAndCreateNewAuthForUser,
          ).pipe(
            map(({ isSignUp, ...args }) => ({
              ...args,
              renderText: isSignUp ?
                renderUserSignUpMail :
                renderUserSignInMail,
            })),
            switchMap(({ guid, token, renderText }) =>
              sendMail({
                to: email,
                subject: 'sign in',
                text: renderText({
                  token,
                  guid: guid,
                  url: app.get('url'),
                }),
              }),
            ),
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
      },
    },
  };
};
