import * as R from 'ramda';
import createDebugger from 'debug';
import dedent from 'dedent';
import moment from 'moment';
import { gql } from 'apollo-server-express';
import { aql } from 'arangojs';
import { defer, forkJoin, merge } from 'rxjs';
import { normalizeEmail } from 'validator';
import * as OP from 'rxjs/operators';

import * as User from './User.js';
import renderUserSignInMail from './user-sign-in.js';
import renderUserSignUpMail from './user-sign-up.js';

import { deferPromise, authUtils } from '../utils';

const log = createDebugger('wndlr:server:Models:UserAuthentication');

const createWaitMessage = timeTillAuthReset => dedent`
Please wait at least ${timeTillAuthReset} minute${
  timeTillAuthReset > 1 ? 's' : ''
} for the sign in email to arrive
  before requesting a new one.
`;

export const ttl = moment.duration(15, 'minutes').asMilliseconds();
export const authResetTime = 5;

export const gqlType = gql`
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

const pluckCreatedOn = R.prop('createdOn');
const createResetMoment = () => moment().subtract(authResetTime, 'm');

export const isAuthRecent = R.pipe(
  pluckCreatedOn,
  moment,
  createdOn => createdOn.isAfter(createResetMoment()),
);

export const getWaitTime = R.pipe(
  pluckCreatedOn,
  moment,
  createdOn => createdOn.diff(createResetMoment()),
  moment.duration,
  dur => dur.minutes(),
);

export const createToken = R.pipe(
  authUtils.generateVerificationToken,
  OP.map(token => ({
    token,
    ttl: ttl,
  })),
);

const sendWaitMessageForOldAuth = R.pipe(
  OP.pluck('auth'),
  OP.map(getWaitTime),
  OP.map(createWaitMessage),
  OP.map(message => ({ message })),
  OP.tap(() => log('user exists has recent auth')),
);

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
export const sendAuthenEmail = (
  parent,
  { email },
  { get, prisma, sendMail },
) => {
  console.log('prisma: ', prisma.authenToken);
  const url = get('url');
  const normalizedEmail = normalizeEmail(email);
  const findUser = deferPromise(prisma.user.bind(prisma));
  const findAuth = deferPromise(prisma.authenToken.bind(prisma));
  const createUser = deferPromise(prisma.createUser.bind(prisma));
  const updateUser = deferPromise(prisma.updateUser.bind(prisma));

  // email =>
  R.pipe(
    normalizeEmail,
    // Email => Observable<User|Void>
    (normalizedEmail) => findUser({ normalizedEmail }),
    // Observable<User> => Observable<{ user: User|Void, auth: Auth|Void }>
    OP.map(user =>
      defer(() => findAuth({ user })).pipe(
        OP.map(auth => ({ user, auth })),
      ),
    ),
    // => [Observable<{ user: User, auth: Auth|Void }>, Observable<Void>]
    OP.partition(R.pipe(R.prop('user'), Boolean)),
    ([
      userExists,
      noUser,
    ]) => {

      const createUserNAuth = R.pipe(
        OP.switchMap(createToken),
        OP.switchMap((authenToken) => createUser({
          email,
          normalizedEmail,
          authenTokens: {
            create: [ authenToken ],
          },
        })),
      )(noUser);

      // Observable<{ user: User, auth: Auth|Void }>
      const userNeedsNewAuth = R.pipe(
        // => [
        //  Observable<{ user: User, auth: Auth }>,
        //  Observable<{ user: User, auth: Void}>
        // ]
        OP.partition(R.pipe(R.prop('auth'), Boolean)),
        ([
          // need token split this and check for expired auth before delete
          userExistsHasExistingAuth,
          userExistsHasNoAuth,
        ]) => {
          const [
            userHasOldAuth,
            userHasRecentAuth,
          ] = OP.partition(R.pipe(
            R.prop('auth'),
            isAuthRecent
          ))(userExistsHasExistingAuth);

          const userNeedsNewAuth = R.pipe(
            // create token
            OP.switchMap(({ user, auth }) =>
              updateUser({
                where: { id: user.id },
                data: {
                  authenTokens: {
                    delete: { id: auth.id },
                  },
                },
              }),
            ),
            OP.switchMap()
          )(userHasOldAuth);

          const sendWaitMessage = sendWaitMessageForOldAuth(userHasRecentAuth);

          return merge(userNeedsNewAuth, userExistsHasNoAuth).pipe(
            OP.switchMap((user) => createToken().pipe((token) => ({
              guid: user.guid,
              isSignUp: true,
              token: token.token,
            })))
          );
        },
      )(userExists);
    },
  )(email);

  return merge(
    sendWaitMessage,
    R.pipe(
      OP.switchMap(({ guid, token, isSignUp }) => {
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
      OP.tap(emailInfo => console.log('emailInfo: ', emailInfo)),
      // sign in link sent
      // send message to client app
      OP.map(() => ({
        message: dedent`
          We found your existing account.
          Check your email and click the sign in link we sent you.
        `,
      })),
    )(
      merge(
        createUserAndAuth,
        createAuthForUser,
        deleteAndCreateNewAuthForUser,
      ),
    ),
  ).toPromise();
};
