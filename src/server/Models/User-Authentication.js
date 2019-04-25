import * as R from 'ramda';
import createDebugger from 'debug';
import dedent from 'dedent';
import moment from 'moment';
import { gql } from 'apollo-server-express';
import { of, merge } from 'rxjs';
import { normalizeEmail } from 'validator';
import * as OP from 'rxjs/operators';

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

// const sendWaitMessageForOldAuth = R.pipe(
//   OP.pluck('auth'),
//   OP.map(getWaitTime),
//   OP.map(createWaitMessage),
//   OP.map(message => ({ message })),
//   OP.tap(() => log('user exists has recent auth')),
// );

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
  const url = get('url');
  const sendAuthMail = ({ email, guid, token, isSignUp }) => {
    const renderText = isSignUp ?
      renderUserSignUpMail :
      renderUserSignInMail;

    return sendMail({
      to: email,
      subject: isSignUp ? 'Sign Up' : 'Sign In',
      text: renderText({
        token,
        guid,
        url,
      }),
    });
  };
  const normalizedEmail = normalizeEmail(email);
  const findUser = deferPromise(prisma.user.bind(prisma));
  const findAuths = deferPromise(prisma.authenTokens.bind(prisma));
  const createUser = deferPromise(prisma.createUser.bind(prisma));
  const updateUser = deferPromise(prisma.updateUser.bind(prisma));
  const createTokenForUser = deferPromise(
    prisma.createAuthenToken.bind(prisma)
  );

  // email =>
  return R.pipe(
    normalizeEmail,
    // Email => Observable<User|Void>
    (normalizedEmail) => findUser({ normalizedEmail }),
    // Observable<User> => Observable<{ user: User|Void, auth: Auth|Void }>
    OP.switchMap(user =>
      user ? findAuths({ where: { user: { id: user.id } } }).pipe(
        OP.map(auth => ({ user, auth })),
      ) : of({ user }),
    ),
    // => [Observable<{ user: User, auth: Auth|Void }>, Observable<Void>]
    OP.partition(R.pipe(R.prop('user'), Boolean)),
    ([
      existingUser,
      noUser,
    ]) => {

      const createUserNAuth = R.pipe(
        OP.tap(() => log('new user')),
        OP.switchMap(createToken),
        OP.switchMap((authenToken) => createUser({
          email,
          normalizedEmail,
          authenTokens: {
            create: [ authenToken ],
          },
        }).pipe(OP.map(({ id, email }) => ({
          email,
          guid: id,
          token: authenToken.token,
          isSignUp: true,
        })))),
        OP.switchMap(sendAuthMail),
        // OP.tap((emailInfo) => log('emailInfo: ', emailInfo)),
        OP.mapTo({
          message: dedent`
            Welcome! We've sent you a sign in email. Give it a few
            seconds to arrive.
          `,
        }),
      )(noUser);

      // Observable<{ user: User, auth: Auth|Void }>
      const handleExistingUser = R.pipe(
        // => [
        //  Observable<{ user: User, auth: Auth }>,
        //  Observable<{ user: User, auth: Void}>
        // ]
        OP.tap(() => log('existing user')),
        OP.partition(R.pipe(R.prop('auth'), Boolean)),
        ([
          // need token split this and check for expired auth before delete
          hasExistingAuth,
          hasNoAuth,
        ]) => {
          const handleNoToken = R.pipe(
            OP.tap(() => log('no auth')),
            OP.switchMap(({ user }) => createToken().pipe(
              OP.switchMap((token) => createTokenForUser({
                ...token,
                user: { connect: { id: user.id } },
              })),
              OP.map((auth) => ({
                email,
                guid: user.id,
                isSignUp: false,
                token: auth.token,
              })),
              OP.switchMap(sendAuthMail),
              OP.mapTo({
                message: dedent`
                  Sign in email is on it's way!
                `,
              })
            )),
          )(hasNoAuth);

          const [ userHasOldAuth ] = OP.partition(R.pipe(
            R.prop('auth'),
            isAuthRecent
          ))(hasExistingAuth);

          const handleOldToken = R.pipe(
            OP.tap(() => log('old token')),
            // create token
            OP.switchMap(({ user, auth }) => createToken().pipe(
              OP.switchMap((newToken) => updateUser({
                where: { id: user.id },
                data: {
                  authenTokens: {
                    delete: auth.map((t) => ({ id: t.id })),
                    create: [ newToken ],
                  },
                },
              }).pipe(OP.mapTo({
                guid: user.id,
                token: newToken.token,
                email,
              }))),
              OP.switchMap(sendAuthMail),
              OP.mapTo({
                message: `
                  Sign in
                `,
              })
            )),
          )(userHasOldAuth);

          // const sendWaitMessage =
          // sendWaitMessageForOldAuth(userHasRecentAuth);

          return merge(handleNoToken, handleOldToken);
        },
      )(existingUser);

      return merge(handleExistingUser, createUserNAuth);
    },
    (obv) => obv.toPromise(),
  )(email);
};
