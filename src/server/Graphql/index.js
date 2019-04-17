import * as R from 'ramda';
import isDev from 'isdev';
import { ApolloServer, gql } from 'apollo-server-express';
import { prisma } from '../generated/prisma-client';
import { sendMail } from '../utils';

import { typeDefs, Resolvers } from './schema.js';
import {
  typeDefs as emailTypeDefs,
  resolvers as emailResolvers,
} from './GraphQLEmail.js';

const rootType = gql`
  type Query {
    Users: [User]
  }
`;

export default function graphql(app) {
  // The GraphQL schema in string form

  const server = new ApolloServer({
    typeDefs: [
      rootType,
      emailTypeDefs,
      typeDefs,
    ],
    resolvers: {
      ...emailResolvers,
      ...Resolvers,
    },
    context: ({ req }) => ({
      req,
      prisma,
      get: R.bind(app.get, app),
      sendMail,
    }),
    playground: isDev,
    debug: isDev,
  });

  server.applyMiddleware({ app });
}
