// @flow
import { normalizeEmail } from 'validator';

import { authUtils } from '../../../utils';

export const createNewUser = (email: string, createdOn: number = Date.now()) =>
  authUtils.generateVerificationToken().map(guid => ({
    guid,
    email,
    normalizedEmail: normalizeEmail(email),
    createdOn,
    lastUpdatedOn: createdOn,
  }));
