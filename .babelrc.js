const { getIfUtils, removeEmpty } = require('webpack-config-utils');

module.exports = function(context, options = {}) {
  const {
    ifClient,
    ifNotClient: ifNode,
    ifDevelopment: ifDev,
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
      ifDev('flow-react-proptypes'),
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
};
