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
    [
      'env',
      {
        targets: removeEmpty({
          node: ifNode('current'),
          // env does not currently support browserslistrc
          browsers: ifClient('last 2 versions'),
        }),
      },
    ],
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
    'transform-object-rest-spread',
    ifProd('dev-expression'),
    ifClient('react-hot-loader/babel'),
  ]),
};
