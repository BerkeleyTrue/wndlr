// @flow
import moment from 'moment';

import * as UserAthen from './User-Authentication.js';

describe('isAuthRecent', () => {
  test('returns true with recent moment', () => {
    expect(
      UserAthen.isAuthRecent(
        moment()
          .subtract(UserAthen.authResetTime - 2, 'm')
          .valueOf(),
      ),
    ).toBe(true);
  });
  test('returns false with old moment', () => {
    expect(
      UserAthen.isAuthRecent(
        moment()
          .subtract(UserAthen.authResetTime + 2, 'm')
          .valueOf(),
      ),
    ).toBe(false);
  });
});

describe('getWaitTime', () => {
  test('returns minutes since moment', () => {
    const momentAgos = UserAthen.authResetTime - 2;
    expect(
      UserAthen.getWaitTime(
        moment().subtract(momentAgos, 'm'),
      ),
    ).toBe(UserAthen.authResetTime - momentAgos);
  });
});
