import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import createDebugger from 'debug';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import config from '../../webpack.config.js';

const log = createDebugger('wndlr:server');
log.enabled = true;
const isDev = process.env.NODE_ENV !== 'production';
const compiler = webpack(config());

const app = express();
app.set('port', process.env.PORT);

const renderHtml = () => `
<html>
<head>
  <title>wndlr</title>
</head>
<body>
  <div id='app'></div>
  <script src='/js/bundle.js' type='application/javascript'></script>
</body>
`;

app.use(morgan('dev'));
app.use(webpackDevMiddleware(compiler, { heartbeat: 10 * 1000 }));
app.use(express.static('dist'));
app.get('/', (req, res) => res.send(renderHtml({ message: 'hello wndlr' })));

app.listen(app.get('port'), () => {
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
