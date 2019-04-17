import { gql } from 'apollo-server-express';

import { User, UserAuthentication as UserAuthen } from '../Models';

export const typeDefs = gql`
  ${User.gqlType}

  ${UserAuthen.gqlType}

  type Info {
    message: String
  }

  type Mutation {
    sendSignInEmail(email: Email): Info
  }
`;

export const Resolvers = {
  Mutation: {
    sendSignInEmail: UserAuthen.sendAuthenEmail,
  },
};
