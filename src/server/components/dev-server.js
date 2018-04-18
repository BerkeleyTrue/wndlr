import isDev from 'isdev';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../../webpack.config.js';

const clientConfig = config(process.env.NODE_ENV || 'development');
const compiler = webpack(clientConfig);

export default function devServer(app) {
  if (!isDev) {
    return;
  }

  app.use(webpackHotMiddleware(compiler));
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: clientConfig.output.publicPath,
      heartbeat: 10 * 1000,
    }),
  );
}
