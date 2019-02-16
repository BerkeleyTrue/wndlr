import isDev from 'isdev';
import { ApolloServer, gql } from 'apollo-server-express';

import { typeDefs, makeResolvers } from './schema.js';
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
      ...makeResolvers(app),
    },
    playground: isDev,
    debug: isDev,
  });

  server.applyMiddleware({ app });
}
