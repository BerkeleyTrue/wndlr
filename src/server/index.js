import 'dotenv/config';
import express from 'express';
import createDebugger from 'debug';

const log = createDebugger('wndlr:server');
const isDev = process.env.NODE_ENV !== 'production';
log.enabled = true;

const app = express();
app.set('port', process.env.PORT);

app.get('/', (req, res) => res.send('foo'));

app.listen(app.get('port'), () => {
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
