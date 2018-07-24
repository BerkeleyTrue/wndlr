// @flow
import R from 'ramda';
import moment from 'moment';
import { of } from 'rxjs';
import * as OP from 'rxjs/operators';

import * as UserAthen from './User-Authentication.js';

const createAuthFromMoment = moment =>
  UserAthen.createToken().pipe(OP.map(R.assoc('createdOn', moment.valueOf())));

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
        OP.map(UserAthen.isAuthRecent),
        OP.map(R.unary(expect)),
        OP.tap(R.invoker(1, 'toBe')(true)),
      )
      .toPromise());

  test('returns false with old moment', () =>
    createOldAuthFromReset(2)
      .pipe(
        OP.map(UserAthen.isAuthRecent),
        OP.map(R.unary(expect)),
        OP.tap(R.invoker(1, 'toBe')(false)),
      )
      .toPromise());
});

describe('getWaitTime', () => {
  test('returns minutes since moment', () => {
    const momentAgos = UserAthen.authResetTime - 2;
    return createOldAuth(momentAgos)
      .pipe(
        OP.map(UserAthen.getWaitTime),
        OP.map(R.unary(expect)),
        OP.tap(
          R.invoker(1, 'toBeLessThanOrEqual')(
            UserAthen.authResetTime - momentAgos,
          ),
        ),
      )
      .toPromise();
  });
});

describe('sendSignInEmail', () => {
  describe('internals', () => {
    const email = 'foo@dope.business';
    const userPropMatchers = {
      createdOn: expect.any(Number),
      guid: expect.any(String),
      lastUpdatedOn: expect.any(Number),
    };
    const authPropMatchers = {
      createdOn: expect.any(Number),
      token: expect.any(String),
    };
    let queryOne = () => ({});
    let query = () => ({});
    beforeEach(() => {
      queryOne = jest.fn(of);
      query = jest.fn(of);
    });
    describe('queryUserNAuth', () => {
      test('queries using email', () =>
        UserAthen.internals
          // $FlowFixMe
          .queryUserNAuth(queryOne, email)
          .pipe(
            OP.tap(query => {
              expect(query).toMatchSnapshot();
            }),
          )
          .toPromise());
    });
    describe('createUserAndAuth', () => {
      test('queries using user and auth token', () =>
        UserAthen.internals
          // $FlowFixMe
          .createUserAndAuth(queryOne, email, of(null))
          .pipe(
            OP.tap(ret => {
              const query = queryOne.mock.calls[0][0];
              expect(query.bindVars.value0).toMatchSnapshot(userPropMatchers);
              expect(query.bindVars.value1).toMatchSnapshot(authPropMatchers);
              expect(query.query).toMatchSnapshot();
              expect(ret).toMatchSnapshot({
                token: expect.any(String),
                guid: expect.any(String),
              });
            }),
          )
          .toPromise());
    });
    describe('createAuthForUser', () => {
      test('queries with old user', () =>
        UserAthen.internals
          .createAuthForUser(
            queryOne,
            of({ user: { _id: 1234, guid: 'asdf' } }),
          )
          .pipe(
            OP.tap(ret => {
              const query = queryOne.mock.calls[0][0];
              expect(ret).toMatchSnapshot({
                token: expect.any(String),
              });
              expect(query.bindVars.value0).toMatchSnapshot(authPropMatchers);
            }),
          )
          .toPromise());
    });
    describe('destroyAndCreateAuthForUser', () => {
      test('queries with old auth', () =>
        UserAthen.internals
          .deleteAndCreateNewAuthForUser(
            // $FlowFixMe
            query,
            queryOne,
            of({
              user: { _id: 9876, guid: 'asdf' },
              auth: { _id: 1234, _key: 5678 },
            }),
          )
          .pipe(
            OP.tap(ret => {
              const firstQuery = queryOne.mock.calls[0][0];
              const secondQuery = query.mock.calls[0][0];
              expect(ret).toMatchSnapshot({ token: expect.any(String) });
              expect(firstQuery).toMatchSnapshot();
              expect(secondQuery.bindVars).toMatchSnapshot({
                // $FlowFixMe
                value0: authPropMatchers,
                value1: expect.any(Number),
              });
              expect(secondQuery.query).toMatchSnapshot();
            }),
          )
          .toPromise());
    });
  });
});
