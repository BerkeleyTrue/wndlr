import * as R from 'ramda';
import uid from 'uid2';
import { bindNodeCallback } from 'rxjs';

export const generateVerificationToken = R.nAry(
  0,
  bindNodeCallback(uid.bind(null, 64)),
);
