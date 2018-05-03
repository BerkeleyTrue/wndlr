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

import { renderReact, graphql, dataSource } from './controllers';

const log = createDebugger('wndlr:server');
log.enabled = true;

const app = express();

// setttings
app.set('port', process.env.PORT);
app.set('state namespace', '__wndlr__');

app.use(morgan('dev'));
app.use(bodyParser.json());
expressState.extend(app);

dataSource(app);
graphql(app);
renderReact(app);

// server static files
app.use(express.static('dist'));

// $FlowFixMe
app.start = _.once(() => {
  const server = app.listen(app.get('port'), () => {
    app.emit('started');
    log(`server started on port ${app.get('port')}`);
    log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
  });

  // on signal to kill, close server
  process.on('SIGINT', () => {
    log('Shutting down server');
    server.close(() => {
      log('Server is closed');
    });
    // TODO: Disconnect db
  });
});

module.exports = app;

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
