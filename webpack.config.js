const path = require('path');
const rxPaths = require('rxjs/_esm5/path-mapping');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const DashboardPlugin = require('webpack-dashboard/plugin');

// Source maps are resource heavy and can cause out of memory issue for
// large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const clientEntry = { bundle: './src/client/index.js' };
const rxPathsObj = rxPaths();
const rxPathsFixed = Object.keys(rxPathsObj)
  .map(key => [
    key + '$',
    rxPathsObj[key],
  ])
  .reduce((paths, [
    key,
    path,
  ]) => {
    paths[key] = path;
    return paths;
  }, {});

module.exports = env => {
  const { ifProduction: ifProd, ifNotProduction: ifDev } = getIfUtils(
    env,
    Object.keys(env),
  );
  return {
    mode: ifDev('development', 'production'),
    entry: ifDev(
      {
        bundle: [
          'webpack-hot-middleware/client?overlay=true',
          clientEntry.bundle,
        ],
      },
      clientEntry,
    ),
    devtool: ifDev('inline-source-map', 'source-map'),
    output: {
      filename: ifDev('[name].js', '[name]-[hash].js'),
      chunkFilename: ifDev('[name].js', '[name]-[chunkhash].js'),
      path: path.join(__dirname, '/dist/js'),
      publicPath: '/js',
    },
    resolve: {
      alias: rxPathsFixed,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
            path.resolve(__dirname, 'node_modules/rxjs'),
            path.resolve(__dirname, 'node_modules/rxjs-compat'),
          ],
          loader: 'babel-loader',
          options: removeEmpty({
            cacheDirectory: ifDev(true),
          }),
        },
        {
          test: /\.global\.sss$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
          ],
          use: removeEmpty([
            ifDev('style-loader'),
            {
              loader: 'css-loader',
              options: removeEmpty({
                importLoaders: 1,
              }),
            },
            'postcss-loader',
          ]),
        },
        {
          test: /\.sss$/,
          exclude: /\.global\.sss$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
          ],
          use: removeEmpty([
            ifDev('style-loader'),
            {
              loader: 'css-loader',
              options: removeEmpty({
                modules: true,
                importLoaders: 1,
                localIdentName: ifDev('[name]-[local]---[hash:base64:5]'),
              }),
            },
            'postcss-loader',
          ]),
        },
      ],
    },
    plugins: removeEmpty([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(ifDev('development', 'production')),
          __DEVTOOLS__: JSON.stringify(ifDev()),
        },
      }),
      // Use browser version of visionmedia-debug
      new webpack.NormalModuleReplacementPlugin(
        /debug\/src\/index.js/,
        'debug/src/browser.js',
      ),
      ifDev(new webpack.HotModuleReplacementPlugin()),
      ifDev(new webpack.NoEmitOnErrorsPlugin()),
      new DashboardPlugin({ port: 3005 }),
    ]),
    optimization: {
      minimizer: removeEmpty([ ifProd(
        new TerserPlugin({
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress'
              // and 'output' sections only apply transformations that are
              // ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly
              // valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending futher investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly
              // using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true, // eslint-disable-line camelcase
            },
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: shouldUseSourceMap,
        }),
      ) ]),
    },
  };
};
