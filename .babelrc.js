const { getIfUtils, removeEmpty } = require('webpack-config-utils');

module.exports = function(context, options = {}) {
  const env = {
    development: process.env.NODE_ENV !== 'production',
    client: process.env.BABEL_TARGET === 'client' || options.client,
    test: process.env.NODE_ENV === 'test',
  };
  const {
    ifClient,
    ifNotClient: ifNode,
    ifNotDevelopment: ifProd,
    ifTest,
  } = getIfUtils(env, Object.keys(env));

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
      ifTest('istanbul'),
      ifClient([
        'transform-imports',
        {
          'rxjs/operators': {
            transform: 'rxjs/_esm5/internal/operators/${member}',
            preventFullImport: true,
          },
          rxjs: {
            transform(name) {
              if (/(.*)Subject/.test(name)) {
                return `rxjs/_esm5/internal/${name}`;
              }
              if (name === 'Observable') {
                return 'rxjs/_esm5/internal/Observable';
              }
              if (name === 'of') {
                return 'rxjs/_esm5/internal/observable/of';
              }
              return 'rxjs';
            },
          },
        },
      ]),
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
