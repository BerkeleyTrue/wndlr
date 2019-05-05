import * as R from 'ramda';
import createDebugger from 'debug';
import dedent from 'dedent';
import moment from 'moment';
import { arg, objectType, mutationField } from 'nexus';
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

const UserAuthen = objectType({
  name: 'UserAuthen',
  definition(t) {
    t.string('token');
    t.int('ttl');
    t.int('craeatedAt');
  },
});

const pluckCreatedAt = R.prop('createdAt');
const createResetMoment = () => moment().subtract(authResetTime, 'm');

// (Auth) => Boolean
export const isAuthRecent = R.pipe(
  pluckCreatedAt,
  moment,
  createdOn => createdOn.isAfter(createResetMoment()),
);

// (Auth) => Number
export const getWaitTime = R.pipe(
  pluckCreatedAt,
  moment,
  createdOn => createdOn.diff(createResetMoment()),
  moment.duration,
  dur => dur.minutes(),
);

// () => Observable<Token>
export const createToken = R.pipe(
  authUtils.generateVerificationToken,
  OP.map(token => ({
    token,
    ttl: ttl,
  })),
);

// (Observable<Auth>) => Observable<{ message: string }>
const sendWaitMessageForOldAuth = R.pipe(
  OP.map(getWaitTime),
  OP.map(createWaitMessage),
  OP.map(message => ({ message })),
);

export const createMailSender = (url, sendMail) => ({
  email,
  guid,
  token,
  isSignUp,
}) => {
  const renderText = isSignUp ? renderUserSignUpMail : renderUserSignInMail;

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

export const sendAuthenEmail = (
  parent,
  { email },
  { get, prisma, sendMail },
) => {
  const url = get('url');
  const sendAuthMail = createMailSender(url, sendMail);
  const normalizedEmail = normalizeEmail(email);
  const findUser = deferPromise(prisma.user.bind(prisma));
  const findAuths = deferPromise(prisma.authenTokens.bind(prisma));
  const createUser = deferPromise(prisma.createUser.bind(prisma));
  const updateUser = deferPromise(prisma.updateUser.bind(prisma));
  const createTokenForUser = deferPromise(
    prisma.createAuthenToken.bind(prisma),
  );

  // email =>
  return R.pipe(
    normalizeEmail,
    // => Observable<User|Void>
    normalizedEmail => findUser({ normalizedEmail }),
    // => Observable<{ user: User|Void, auth: Auth[]|Void }>
    OP.switchMap(user =>
      user ?
        findAuths({ where: { user: { id: user.id } } }).pipe(
          OP.map(auth => ({ user, auth })),
        ) :
        of({ user }),
    ),
    // => [Observable<{ user: User, auth: Auth[]|Void }>, Observable<Void>]
    OP.partition(
      R.pipe(
        R.prop('user'),
        Boolean,
      ),
    ),
    ([
      existingUser,
      noUser,
    ]) => {
      const handleNewUser = R.pipe(
        OP.tap(() => log('new user')),
        // => Token
        OP.switchMap(createToken),
        // => { email, guid, token, isSignUp }
        OP.switchMap(authenToken =>
          createUser({
            email,
            normalizedEmail,
            authenTokens: {
              create: [ authenToken ],
            },
          }).pipe(
            OP.map(({ id, email }) => ({
              email,
              guid: id,
              token: authenToken.token,
              isSignUp: true,
            })),
          ),
        ),
        OP.switchMap(sendAuthMail),
        // OP.tap((emailInfo) => log('emailInfo: ', emailInfo)),
        OP.mapTo({
          message: dedent`
            Welcome! We've sent you a sign in email. Give it a few
            seconds to arrive.
          `,
        }),
      )(noUser);

      // Observable<{ user: User, auth: Auth[]|Void }>
      const handleExistingUser = R.pipe(
        OP.tap(() => log('existing user')),
        // => [
        //  Observable<{ user: User, auth: Auth[] }>,
        //  Observable<{ user: User, auth: Void}>
        // ]
        OP.partition(
          R.pipe(
            R.prop('auth'),
            R.isEmpty,
            R.not,
          ),
        ),
        ([
          // need token split this and check for expired auth before delete
          hasExistingAuth,
          hasNoAuth,
        ]) => {
          const handleNoAuth = R.pipe(
            OP.tap(() => log('no auth')),
            OP.withLatestFrom(createToken()),
            OP.switchMap(([
              { user },
              token,
            ]) =>
              createTokenForUser({
                ...token,
                user: { connect: { id: user.id } },
              }).pipe(
                OP.map(auth => ({
                  email,
                  guid: user.id,
                  isSignUp: false,
                  token: auth.token,
                })),
              ),
            ),
            OP.switchMap(sendAuthMail),
            OP.mapTo({
              message: dedent`
                Sign in email is on it's way!
              `,
            }),
          )(hasNoAuth);

          const handleExistingAuth = R.pipe(
            // => [
            //  Observable<{ user: User, auth: Auth[] }>,
            //  Observable<{ user: User, auth: Auth[] }>
            // ]
            OP.partition(
              R.pipe(
                R.prop('auth'),
                R.head,
                isAuthRecent,
              ),
            ),
            ([
              hasRecentAuth,
              hasOldAuth,
            ]) => {
              const handleOldToken = R.pipe(
                OP.tap(() => log('old token')),
                // create token
                OP.withLatestFrom(createToken()),
                OP.switchMap(([
                  { user, auth },
                  newToken,
                ]) =>
                  updateUser({
                    where: { id: user.id },
                    data: {
                      authenTokens: {
                        delete: auth.map(t => ({ id: t.id })),
                        create: [ newToken ],
                      },
                    },
                  }).pipe(
                    OP.mapTo({
                      guid: user.id,
                      token: newToken.token,
                      email,
                    }),
                  ),
                ),
                OP.switchMap(sendAuthMail),
                OP.mapTo({
                  message: `
                    Sign in
                  `,
                }),
              )(hasOldAuth);

              const handleRecentAuth = R.pipe(
                OP.tap(() => log('has recent auth')),
                OP.pluck('auth'),
                OP.map(R.head),
                sendWaitMessageForOldAuth,
              )(hasRecentAuth);

              return merge(handleOldToken, handleRecentAuth);
            },
          )(hasExistingAuth);

          return merge(handleExistingAuth, handleNoAuth);
        },
      )(existingUser);

      return merge(handleExistingUser, handleNewUser);
    },
    OP.tap(() => {}, err => console.error(err)),
    obv => obv.toPromise(),
  )(email);
};

export const typeDefs = [
  UserAuthen,
  mutationField('sendAuthenEmail', {
    type: 'Info',
    args: {
      email: arg({ type: 'Email' }),
    },
    resolve: sendAuthenEmail,
  }),
];
