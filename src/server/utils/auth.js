// @flow
import uid from 'uid2';
import { Observable } from 'rxjs';

export const generateVerificationToken = Observable.bindNodeCallback(
  uid.bind(null, 64),
);

export const createToken = (
  ttl: number,
): Observable<{ ttl: number, token: string, createdOn: number }> =>
  generateVerificationToken().map(token => ({
    token,
    ttl,
    createdOn: Date.now(),
  }));
