// @flow
import 'dotenv/config';
import 'source-map-support/register';
import express from 'express';
import morgan from 'morgan';
import expressState from 'express-state';
import createDebugger from 'debug';
import isDev from 'isdev';
import bodyParser from 'body-parser';

import addRouters from './routers.js';
import { general as config } from './config.js';

const log = createDebugger(`${config.ns}:server`);
log.enabled = true;

const app = express();

// setttings
Object.keys(config)
  .map(key => [
    key,
    config[key],
  ])
  .forEach(args => app.set(...args));

app.use(morgan('dev'));
app.use(bodyParser.json());
expressState.extend(app);

addRouters(app);

// server static files
app.use(express.static('dist'));

let onced = false;
// $FlowFixMe
app.start = () => {
  if (onced) {
    return;
  }
  const server = app.listen(app.get('port'), () => {
    app.emit('started');
    log(`${app.get('dn')} server started`);
    log(`server started on port ${app.get('port')}`);
    log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
    if (app.get('proxyPort')) {
      log(`server is behind proxyPort ${app.get('proxyPort')}`);
    }
  });

  // on signal to kill, close server
  process.on('SIGINT', () => {
    log('Shutting down server');
    server.close(() => {
      log('Server is closed');
    });
  });
  onced = true;
};

module.exports = app;

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
