const { getIfUtils, removeEmpty } = require('webpack-config-utils');

module.exports = function(context, options = {}) {
  const {
    ifClient,
    ifNotClient: ifNode,
    ifNotDevelopment: ifProd,
  } = getIfUtils(
    {
      development: process.env.NODE_ENV !== 'production',
      client: process.env.BABEL_TARGET === 'client' || options.client,
    },
    [
      'development',
      'client',
    ],
  );

  return {
    presets: removeEmpty([
      'react',
      [
        'env',
        {
          targets: removeEmpty({
            node: ifNode('current'),
            // env does not currently support browserslistrc
            browsers: ifClient([
              '>0.25%',
              'not ie 11',
              'not op_mini all',
            ]),
          }),
        },
      ],
    ]),
    plugins: removeEmpty([
      [
        'lodash',
        { id: [
          'ramda',
          'ramda-adjunct',
        ] },
      ],
      [
        'transform-runtime',
        {
          helpers: true,
          polyfill: false,
          regenerator: false,
        },
      ],
      'transform-export-extensions',
      'transform-object-rest-spread',
      ifProd('dev-expression'),
      ifClient('react-hot-loader/babel'),
    ]),
  };
};
