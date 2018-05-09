// @flow
import type { $Application } from 'express';
import _ from 'lodash';
import dedent from 'dedent';
import { Observable } from 'rxjs';
import { normalizeEmail } from 'validator';
import { aql } from 'arangojs';

import renderUserSignInMail from './user-sign-in.js';
import renderUserSignUpMail from './user-sign-up.js';
import { sendMail, authUtils } from '../../utils';
import { dataSource as ds } from '../../data-source';

const ttl15Min = 15 * 60 * 1000;

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
        return ds
          .queryOne(
            aql`
              For user In users
              Filter user.NormalizedEmail == ${normalizedEmail}
              Limit 1
              For auth In 1 OUTBOUND user._id userToAuthentication
              Return { user, auth };
            `,
          )
          .switchMap(({ user, auth } = {}) => {
            // if no auth, create auth
            const createUserIfNone = Observable.if(
              _.constant(Boolean(!user)),
              Observable.combineLatest(
                authUtils.generateVerificationToken(),
                authUtils.createToken(ttl15Min),
                (guid, token) => ({ guid, token }),
              ).switchMap(({ guid, token: { ttl, created, token } }) =>
                ds
                  .queryOne(
                    aql`
                      Insert {
                        email: ${email},
                        normalizeEmail: ${normalizedEmail},
                        created: ${Date.now()},
                        lastUpdated: ${Date.now()},
                        guid: ${guid},
                      } Into users;
                      Let user = New;
                      Insert {
                        ttl: ${ttl},
                        created: ${created},
                        token: ${token}
                      } Into userAuthentications
                      // store new doc
                      Let auth = New
                      // create edge to user
                      Insert {
                        _from: ${user._id},
                        _to: auth._id
                      } Into userToAuthentication
                    `,
                  )
                  .mapTo({ token, guid }),
              ),
            );

            const createAuthTokenIfNone = Observable.if(
              _.constant(user && !auth),
              // user has no auth doc,
              // create one and assoc with user
              authUtils
                .createToken(ttl15Min)
                .switchMap(({ ttl, created, token }) =>
                  // save token to db
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
                    Let auth = New
                    // create edge to user
                    Insert {
                      _from: ${user._id},
                      _to: auth._id
                    } Into userToAuthentication
                  `,
                    )
                    .mapTo({ token, guid: user.guid }),
                ),
            );

            return (
              Observable.combineLatest(
                createUserIfNone,
                createAuthTokenIfNone,
                (a, b) => a || b,
              )
                .map(({ guid, token }) =>
                  sendMail({
                    to: email,
                    subject: 'sign in',
                    text: renderUserSignInMail({
                      token,
                      guid: guid,
                      url: app.get('url'),
                    }),
                  }),
                )
                // sign in link sent
                // send message to client app
                .map(() => ({
                  message: dedent`
                    We found your existing account.
                    Check your email and click the sign in link we sent you.
                  `,
                }))
            );
          }).toPromise();
      },
    },
  };
};
