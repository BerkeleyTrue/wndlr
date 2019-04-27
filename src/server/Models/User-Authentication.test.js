import moment from 'moment';
// import { of } from 'rxjs';
import * as OP from 'rxjs/operators';

import * as UserAthen from './User-Authentication.js';

const createOldAuth = timeAgo =>
  UserAthen.createToken().pipe(
    OP.map(authToken => {
      authToken.createdAt = moment()
        .subtract(timeAgo, 'm')
        .valueOf();
      return authToken;
    }),
  );

const createOldAuthFromReset = addThis =>
  createOldAuth(UserAthen.authResetTime + addThis);

describe('isAuthRecent', () => {
  test('returns true with recent moment', () =>
    createOldAuthFromReset(-2)
      .pipe(
        OP.map(UserAthen.isAuthRecent),
        OP.tap(isAuthRecent => expect(isAuthRecent).toBe(true)),
      )
      .toPromise());

  test('returns false with old moment', () =>
    createOldAuthFromReset(2)
      .pipe(
        OP.map(UserAthen.isAuthRecent),
        OP.tap(isAuthRecent => expect(isAuthRecent).toBe(false)),
      )
      .toPromise());
});

describe('getWaitTime', () => {
  test('returns minutes since moment', () => {
    const momentAgos = UserAthen.authResetTime - 2;
    return createOldAuth(momentAgos)
      .pipe(
        OP.map(UserAthen.getWaitTime),
        OP.tap(waitTime =>
          expect(waitTime).toBeLessThanOrEqual(
            UserAthen.authResetTime - momentAgos,
          ),
        ),
      )
      .toPromise();
  });
});

describe('createMailSender', () => {
  test('should be a factory', () => {
    const sendAuthMail = UserAthen.createMailSender();
    expect(typeof sendAuthMail).toBe('function');
  });

  test('should call sendMail', () => {
    const sendMail = jest.fn((x) => x);
    const sendAuthMail = UserAthen.createMailSender('foo', sendMail);
    expect(sendAuthMail({
      email: 'Foo',
      guid: '1234',
      token: 'asdf',
      isSignUp: true,
    })).toMatchSnapshot();

    expect(sendAuthMail({
      email: 'Foo',
      guid: '1234',
      token: 'asdf',
      isSignUp: false,
    })).toMatchSnapshot();
  });
});
