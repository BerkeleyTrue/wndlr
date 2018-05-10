// @flow
import type { $Application } from 'express';
import _ from 'lodash';
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
const log = createDebugger('wndlr:server:controllers:graphql');

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
        const queryUserNAuth = ds
          .queryOne(
            aql`
              Let user = First(
                For user In users
                Filter user.normalizedEmail == ${normalizedEmail}
                Limit 1
                Return user
              )

              Let auth = !IS_NULL(user) ? First(
                For auth In 1 OUTBOUND user._id userToAuthentication
                Return auth
              ) : NULL
              Return { user, auth }
            `,
          )
          .do(info => console.log('find results: ', info));

        const [
          userExists,
          noUser,
        ] = queryUserNAuth.partition(
          ({ user }) => !!user,
        );
        const [ userExistsHasNoAuth ] = userExists.partition(
          ({ auth }) => !!auth,
        );

        const createUserAndAuth = noUser
          .switchMap(() =>
            Observable.forkJoin(
              authUtils.generateVerificationToken(),
              authUtils.createToken(ttl15Min),
              (guid, token) => ({ guid, token }),
            ),
          )
          .switchMap(({ guid, token: { ttl, created, token } }) =>
            ds
              .queryOne(
                aql`
                  // create user and authen
                  Insert {
                    email: ${email},
                    normalizedEmail: ${normalizedEmail},
                    created: ${Date.now()},
                    lastUpdated: ${Date.now()},
                    guid: ${guid}
                  } Into users
                  Let user = NEW
                  Insert {
                    ttl: ${ttl},
                    created: ${created},
                    token: ${token}
                  } Into userAuthentications
                  // store new doc
                  Let auth = NEW
                  // create edge to user
                  Insert {
                    _from: user._id,
                    _to: auth._id
                  } Into userToAuthentication
              `,
              )
              .do(() => log('create user'))
              .mapTo({ token, guid, isSignUp: true }),
          );

        const createAuthForUser = userExistsHasNoAuth
          .switchMap(({ user }) =>
            authUtils
              .createToken(ttl15Min)
              .switchMap(({ ttl, created, token }) =>
                ds
                  .queryOne(
                    aql`
                      // create authen
                      Insert {
                        ttl: ${ttl},
                        created: ${created},
                        token: ${token}
                      } Into userAuthentications
                      // store new doc
                      Let auth = NEW
                      // create edge to user
                      Insert {
                        _from: ${user._id},
                        _to: auth._id
                      } Into userToAuthentication
                    `,
                  )
                  .do(() => log('create auth'))
                  .mapTo({ token, guid: user.guid, isSignUp: false }),
              ),
          )
          .do(auth => console.log('create auth for user: ', auth));

        return (
          Observable.merge(createUserAndAuth, createAuthForUser)
            .do(
              () => console.log('foo'),
              err => console.log('err: ', err),
              () => console.log('done'),
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
            }))
            .do(data => console.log('data: ', data))
            .toPromise()
        );
      },
    },
  };
};
