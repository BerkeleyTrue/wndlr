import * as R from 'ramda';
import isDev from 'isdev';
import { ApolloServer } from 'apollo-server-express';
import { prisma } from '../generated/prisma-client';
import { sendMail } from '../utils';

import schema from './schema.js';

export default function graphql(app) {
  // The GraphQL schema in string form

  const server = new ApolloServer({
    schema,
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
