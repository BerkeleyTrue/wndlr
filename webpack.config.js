const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = () => [ {
  mode: isDev ? 'development' : 'production',
  entry: { bundle: './src/client/index.jsx' },
  devtool: isDev ? 'inline-source-map' : 'source-map',
  output: {
    filename: isDev ? '[name].js' : '[name]-[hash].js',
    chunkFilename: isDev ? '[name].js' : '[name]-[chunkhash].js',
    path: path.join(__dirname, '/public/js'),
    publicPath: '/js',
  },
  module: {
    rules: [ {
      test: /\.jsx?$/,
      include: [
        path.resolve(__dirname, 'src/client'),
        path.resolve(__dirname, 'src/common'),
      ],
      loader: 'babel-loader',
    } ],
  },
  // entry: 'src/server/index.js',
  // target: 'node',
  // // don't bundle anything not in nodemodules or relative path
  // externals: [ /^(?!\.|\/).+/i ],
  // output: {
  //   libraryTarget: 'commonjs',
  // },
} ];
