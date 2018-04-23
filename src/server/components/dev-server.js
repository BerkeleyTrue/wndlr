// @flow
import type { $Application } from 'express';
import isDev from 'isdev';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import createDebugger from 'debug';

import config from '../../../webpack.config.js';

const log = createDebugger('wndlr:server:components:dev-server');
const clientConfig = config(process.env.NODE_ENV || 'development');
const compiler = webpack(clientConfig);

export default function devServer(app: $Application) {
  if (!isDev) {
    return;
  }

  app.use(webpackHotMiddleware(compiler, { log }));
  app.use(
    webpackDevMiddleware(compiler, {
      log,
      publicPath: clientConfig.output.publicPath,
      heartbeat: 10 * 1000,
    }),
  );
}
