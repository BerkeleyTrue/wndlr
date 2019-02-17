const { getIfUtils, removeEmpty } = require('webpack-config-utils');

module.exports = function(api) {
  const isClient = api.caller(({ name }) => name === 'babel-loader-client');
  const env = {
    development: process.env.NODE_ENV !== 'production',
    client: process.env.BABEL_TARGET === 'client' || isClient,
    test: process.env.NODE_ENV === 'test',
  };
  api.cache.using(() => isClient ? 'client' : 'nonde');
  const {
    ifClient,
    ifNotClient: ifNode,
    ifNotDevelopment: ifProd,
    ifTest,
  } = getIfUtils(env, Object.keys(env));

  return {
    presets: removeEmpty([
      '@babel/react',
      [
        '@babel/env',
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
              if ((/(.*)Subject/).test(name)) {
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
        '@babel/plugin-transform-runtime',
        {
          helpers: true,
          regenerator: false,
        },
      ],
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-object-rest-spread',
      ifProd('dev-expression'),
      ifClient('react-hot-loader/babel'),
    ]),
  };
};
