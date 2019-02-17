const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const DashboardPlugin = require('webpack-dashboard/plugin');

module.exports = env => {
  const { ifNotProduction: ifDev } = getIfUtils(env);
  return {
    mode: ifDev('development', 'production'),
    entry: './src/server/common-to-server.js',
    target: 'node',
    // don't bundle anything not in nodemodules or relative path
    externals: nodeExternals(),
    output: {
      libraryTarget: 'commonjs',
      filename: 'common-to-server.js',
      path: path.join(__dirname, '/dist/server'),
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: [
            path.resolve(__dirname, 'src/server'),
            path.resolve(__dirname, 'src/common'),
          ],
          loader: 'babel-loader',
          options: removeEmpty({
            cacheDirectory: ifDev(true),
            caller: { name: 'babel-loader-server' },
          }),
        },
        {
          test: /\.global\.sss$/,
          include: [
            path.resolve(__dirname, 'src/client'),
            path.resolve(__dirname, 'src/common'),
          ],
          use: removeEmpty([
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
            path.resolve(__dirname, 'src/server'),
            path.resolve(__dirname, 'src/common'),
          ],
          use: removeEmpty([
            MiniCssExtractPlugin.loader,
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
      new MiniCssExtractPlugin(),
      ifDev(new webpack.NoEmitOnErrorsPlugin()),
      ifDev(new DashboardPlugin({ port: 3006 })),
    ]),
  };
};
