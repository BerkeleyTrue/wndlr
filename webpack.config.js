const path = require('path');
const webpack = require('webpack');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');

const isDev = process.env.NODE_ENV !== 'production';

const clientEntry = { bundle: './src/client/index.jsx' };

module.exports = env => {
  const { ifNotProduction: ifDev } = getIfUtils(env);
  return [ {
    mode: isDev ? 'development' : 'production',
    entry: isDev ?
      {
        bundle: [
          'webpack-hot-middleware/client',
          clientEntry.bundle,
        ],
      } :
      clientEntry,
    devtool: isDev ? 'inline-source-map' : 'source-map',
    output: {
      filename: isDev ? '[name].js' : '[name]-[hash].js',
      chunkFilename: isDev ? '[name].js' : '[name]-[chunkhash].js',
      path: path.join(__dirname, '/dist/js'),
      publicPath: '/js',
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
          ],
          loader: 'babel-loader?cacheDirectory',
        },
        {
          test: /\.sss$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
          ],
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: removeEmpty({
                modules: true,
                importLoaders: 1,
                localIdentName: ifDev('[name]-[local]---[hash:base64:5]'),
              }),
            },
            'postcss-loader',
          ],
        },
      ],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    ],
    // entry: 'src/server/index.js',
    // target: 'node',
    // // don't bundle anything not in nodemodules or relative path
    // externals: [ /^(?!\.|\/).+/i ],
    // output: {
    //   libraryTarget: 'commonjs',
    // },
  } ];
};
