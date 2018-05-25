// @flow
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import R from 'ramda';
import moment from 'moment';

import { authUtils } from '../utils';

export const ttl15Min = 15 * 60 * 1000;
export const authResetTime = 5;

export const gqlType = `
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

export type AuthenToken = {
  ttl: number,
  token: string,
  createdOn: number,
};

const pluckCreatedOn = R.prop('createdOn');
const createResetMoment = R.nAry(
  0,
  R.pipe(moment, R.invoker(2, 'subtract')(authResetTime, 'm')),
);

export const isAuthRecent = R.pipe(pluckCreatedOn, moment, createdOnMoment =>
  createdOnMoment.isAfter(createResetMoment()),
);

export const getWaitTime = R.pipe(
  pluckCreatedOn,
  moment,
  createdOn => createdOn.diff(createResetMoment()),
  moment.duration,
  R.invoker(0, 'minutes'),
);

export const createToken = (): Observable<AuthenToken> =>
  authUtils.generateVerificationToken().pipe(
    map(token => ({
      token,
      ttl: ttl15Min,
      createdOn: Date.now(),
    })),
  );
