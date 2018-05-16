// @flow
import uid from 'uid2';
import { Observable } from 'rxjs';

export const generateVerificationToken = Observable.bindNodeCallback(
  uid.bind(null, 64),
);
