const path = require('path');
const webpack = require('webpack');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');

const clientEntry = { bundle: './src/client/index.jsx' };

module.exports = env => {
  const { ifProduction: ifProd, ifNotProduction: ifDev } = getIfUtils(env);
  return [ {
    mode: ifDev('development', 'production'),
    entry: ifDev(
      {
        bundle: [
          'webpack-hot-middleware/client',
          clientEntry.bundle,
        ],
      },
      clientEntry),
    devtool: ifDev('inline-source-map', 'source-map'),
    output: {
      filename: ifDev('[name].js', '[name]-[hash].js'),
      chunkFilename: ifDev('[name].js', '[name]-[chunkhash].js'),
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
