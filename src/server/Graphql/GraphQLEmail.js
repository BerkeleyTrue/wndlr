import R from 'ramda';
import { scalarType } from 'nexus';
import { Kind } from 'graphql/language';
import { GraphQLError } from 'graphql/error';
import { isEmail, normalizeEmail } from 'validator';

export const Email = scalarType({
  name: 'Email',
  description: 'Email scalar',
  asNexusMethod: 'email',
  serialize(value) {
    if (typeof value !== 'string') {
      return null;
    }
    if (isEmail(value)) {
      return R.toLower(value);
    }
    return null;
  },
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new GraphQLError('', []);
    }
    if (isEmail(value)) {
      return value;
    }
    throw new GraphQLError('value is not an email format', []);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      const message = `type should be "String", found ${ast.kind}.`;
      throw new GraphQLError(message, [ ast ]);
    }
    if (isEmail(ast.value)) {
      return ast.value;
    }
    throw new GraphQLError('value is not a valid email format', [ ast ]);
  },
});

export const NormalizedEmail = scalarType({
  name: 'NormalizedEmail',
  asNexusMethod: 'normalizedEmail',
  description: 'Normalized Email scalar',
  serialize(value) {
    if (typeof value !== 'string') {
      return null;
    }
    if (isEmail(value)) {
      return normalizeEmail(value);
    }
    return null;
  },
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new GraphQLError('Email value must be a string', []);
    }
    if (isEmail(value)) {
      return normalizeEmail(value);
    }
    throw new GraphQLError('Email value is not a valid email format', []);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      const message = `Type should be "String", found ${ast.kind}.`;
      throw new GraphQLError(message, [ ast ]);
    }
    if (isEmail(ast.value)) {
      return normalizeEmail(ast.value);
    }
    throw new GraphQLError('Invalid Email literal', [ ast ]);
  },
});

export const typeDefs = [
  Email,
  NormalizedEmail,
];
