// @flow
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeEmail } from 'validator';

import { authUtils } from '../utils';

export const gqlType = `
  """
  User Document:
  """
  type User {
    """
    Used to send emails
    """
    email: Email

    """
    Used to identify a user
    """
    normalizedEmail: NormalizedEmail

    isEmailVerified: Boolean

    """
    Used to find a user from an unsubscribe link
    """
    guid: String

    createdOn: Int
    lastUpdatedOn: Int
  }
`;

export type User = {
  email: string,
  normalizedEmail: string,
  isEmailVerified: boolean,
  guid: string,
  createdOn: number,
  lastUpdatedOn: number,
};

export const createNewUser = (
  email: string,
  createdOn: number = Date.now(),
): Observable<User> =>
  authUtils.generateVerificationToken().pipe(
    map(guid => ({
      guid,
      email,
      normalizedEmail: normalizeEmail(email),
      isEmailVerified: false,
      createdOn,
      lastUpdatedOn: createdOn,
    })),
  );
