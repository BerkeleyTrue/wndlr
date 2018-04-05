import express from 'express';
import createDebugger from 'debug';

const log = createDebugger('wndlr:server');

const app = express();

app.get('/', (req, res) => res.send('foo'));

app.listen(app.get('port'), () => {
  log('server started');
});
