// @flow
import 'dotenv/config';
import 'source-map-support/register';
import _ from 'lodash';
import express from 'express';
import morgan from 'morgan';
import expressState from 'express-state';
import createDebugger from 'debug';
import isDev from 'isdev';
import bodyParser from 'body-parser';

import { renderReact, graphql } from './controllers';
import { general as config } from './config.js';

const log = createDebugger(`${config.ns}:server`);
log.enabled = true;

const app = express();

// setttings
_.forEach(config, (val, key) => app.set(key, val));

app.use(morgan('dev'));
app.use(bodyParser.json());
expressState.extend(app);

graphql(app);
renderReact(app);

// server static files
app.use(express.static('dist'));

// $FlowFixMe
app.start = _.once(() => {
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
});

module.exports = app;

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
