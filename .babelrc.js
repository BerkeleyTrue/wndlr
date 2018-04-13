const { getIfUtils, removeEmpty } = require('webpack-config-utils');

const { ifClient, ifNotClient: ifNode, ifNotDevelopment: ifProd } = getIfUtils(
  {
    development: process.env.NODE_ENV !== 'production',
    client: process.env.BABEL_TARGET === 'client',
  },
  [
    'development',
    'client',
  ],
);

module.exports = {
  presets: removeEmpty([
    'react',
    ifNode([
      'env',
      { targets: { node: 'current' } },
    ]),
    ifClient([
      'env',
      // env does not currently support browserslistrc
      { targets: { browsers: 'last 2 versions' } },
    ]),
  ]),
  plugins: removeEmpty([
    'lodash',
    [
      'transform-runtime',
      {
        helpers: true,
        polyfill: false,
        regenerator: false,
      },
    ],
    ifProd('dev-expression'),
    ifClient('react-hot-loader/babel'),
  ]),
};
