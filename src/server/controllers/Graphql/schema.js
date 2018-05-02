export const typeDefs = `
  type User {
    email: Email
    normalizedEmail: NormalizedEmail
    isEmailVerified: Boolean
  }

  type UserAuthen {
    token: String
    emailAuthLinkTTL: Int
  }

  type Mutation {
    sendSignInEmail(email: Email): String
  }
`;

export const resolvers = {
  Mutation: {
    sendSignInEmail: (root, { email }) => {
      console.log('email: ', email);
      return 'Email Sent';
    },
  },
};
