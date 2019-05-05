import path from 'path';
import { objectType, makeSchema } from 'nexus';

import { UserAuthentication as UserAuthen } from '../Models';
import * as Email from './GraphQLEmail';

const Info = objectType({
  name: 'Info',
  asNexusMethod: 'info',
  definition(t) {
    t.string('message');
  },
});

const Mutation = objectType({
  name: 'Mutation',
  definition() {
  },
});


export const typeDefs = [
  ...Email.typeDefs,
  Info,
  Mutation,
  // ...User.gqlTypes,
  ...UserAuthen.typeDefs,
];

export default makeSchema({
  types: typeDefs,
  outputs: {
    schema: path.join(__dirname, './schema.graphql'),
    typegen: path.join(__dirname, './typegen.ts'),
  },
});
