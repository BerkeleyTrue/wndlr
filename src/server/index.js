import 'dotenv/config';
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

app.listen(app.get('port'), () => {
  app.emit('started');
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
