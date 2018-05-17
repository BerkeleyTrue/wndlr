// @flow
import { type Observable } from 'rxjs';
import R from 'ramda';
import moment from 'moment';

import { authUtils } from '../utils';

const ttl15Min = 15 * 60 * 1000;
const authResetTime = 5;

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

export const isAuthRecent = (createdOn: number) =>
  moment(createdOn).isAfter(moment().subtract(authResetTime, 'm'));

export const getWaitTime = R.pipe(
  moment,
  createdOn => createdOn.diff(moment().subtract(authResetTime, 'm')),
  moment.duration,
  R.invoker(0, 'minutes'),
);

export const createToken = (): Observable<AuthenToken> =>
  authUtils.generateVerificationToken().map(token => ({
    token,
    ttl: ttl15Min,
    createdOn: Date.now(),
  }));
