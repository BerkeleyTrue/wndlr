// @flow
import type { $Application } from 'express';

import { User, UserAuthentication as UserAuthen } from '../Models';
import { sendMail } from '../utils';
import { dataSource as ds } from '../Data-Source';


export const typeDefs = `
  ${User.gqlType}

  ${UserAuthen.gqlType}

  type Info {
    message: String
  }

  type Mutation {
    sendSignInEmail(email: Email): Info
  }
`;

export const makeResolvers = function(app: $Application) {
  return {
    Mutation: {
      sendSignInEmail: UserAuthen.sendSignInEmail(
        app.get('url'),
        sendMail,
        ds
      ),
    },
  };
};
