import isDev from 'isdev';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

import { typeDefs, resolvers } from './schema.js';
import {
  typeDefs as emailTypeDefs,
  resolvers as emailResolvers,
} from './GraphQLEmail.js';

const rootType = `
  type Query {
    Users: [User]
  }
`;
export default function graphql(app) {
  // The GraphQL schema in string form

  const schema = makeExecutableSchema({
    typeDefs: [
      rootType,
      emailTypeDefs,
      typeDefs,
    ],
    resolvers: [
      emailResolvers,
      resolvers,
    ],
  });

  app.use('/graphql', graphqlExpress({ schema }));
  if (isDev) {
    app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));
  }
}
