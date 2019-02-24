import { gql } from 'apollo-server-express';
import { map } from 'rxjs/operators';
import { normalizeEmail } from 'validator';

import { authUtils } from '../utils';

export const gqlType = gql`
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

    createdOn: Int
    updatedOn: Int
  }
`;

export const createNewUser = (email, createdOn = Date.now()) =>
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
