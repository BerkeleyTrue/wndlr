import 'dotenv/config';
import _ from 'lodash';
import express from 'express';
import morgan from 'morgan';
import createDebugger from 'debug';
import isDev from 'isdev';

import { devServer } from './components';
import { renderReact } from './controllers';

const log = createDebugger('wndlr:server');
log.enabled = true;

const app = express();
app.set('port', process.env.PORT);

app.use(morgan('dev'));

devServer(app);
app.use(express.static('dist'));
renderReact(app);

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
