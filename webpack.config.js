const path = require('path');
const rxPaths = require('rxjs/_esm5/path-mapping');
const webpack = require('webpack');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const DashboardPlugin = require('webpack-dashboard/plugin');

const clientEntry = { bundle: './src/client/index.jsx' };
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
                minimize: ifProd(true),
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
                minimize: ifProd(true),
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
      ifProd(
        new UglifyPlugin({
          test: /\.js($|\?)/i,
          cache: true,
          sourceMap: true,
          parallel: true,
          uglifyOptions: {
            ecma: 5,
            mangle: true,
            compress: {
              passes: 3,
              sequences: false,
            },
          },
        }),
      ),
      ifDev(new webpack.HotModuleReplacementPlugin()),
      ifDev(new webpack.NoEmitOnErrorsPlugin()),
      new DashboardPlugin({ port: 3005 }),
    ]),
  };
};
