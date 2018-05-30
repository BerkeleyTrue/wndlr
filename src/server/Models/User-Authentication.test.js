// @flow
import R from 'ramda';
import moment from 'moment';
import { tap, map } from 'rxjs/operators';

import * as UserAthen from './User-Authentication.js';

const createAuthFromMoment = moment =>
  UserAthen.createToken().pipe(map(R.assoc('createdOn', moment.valueOf())));

const now = R.nAry(0, moment);
const createSubtractMinFrom = R.invoker(2, 'subtract')(R.__, 'm');
// $FlowFixMe: flow has issues with curried functions that use a placeholder
const createSubtractMinFromMoment = R.pipe(now, R.flip(createSubtractMinFrom));

const createOldMoment = R.converge(R.call, [
  createSubtractMinFromMoment,
  R.identity,
]);

const createOldAuth = R.pipe(createOldMoment, createAuthFromMoment);

const createOldAuthFromReset = R.pipe(
  R.add(UserAthen.authResetTime),
  createOldAuth,
);

describe('isAuthRecent', () => {
  test('returns true with recent moment', () =>
    createOldAuthFromReset(-2)
      .pipe(
        map(UserAthen.isAuthRecent),
        map(R.unary(expect)),
        tap(R.invoker(1, 'toBe')(true)),
      )
      .toPromise());

  test('returns false with old moment', () =>
    createOldAuthFromReset(2)
      .pipe(
        map(UserAthen.isAuthRecent),
        map(R.unary(expect)),
        tap(R.invoker(1, 'toBe')(false)),
      )
      .toPromise());
});

describe('getWaitTime', () => {
  test('returns minutes since moment', () => {
    const momentAgos = UserAthen.authResetTime - 2;
    return createOldAuth(momentAgos)
      .pipe(
        map(UserAthen.getWaitTime),
        map(R.unary(expect)),
        tap(
          R.invoker(1, 'toBeLessThanOrEqual')(
            UserAthen.authResetTime - momentAgos,
          ),
        ),
      )
      .toPromise();
  });
});
