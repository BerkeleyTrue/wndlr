import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import createDebugger from 'debug';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../webpack.config.js';

const [ clientConfig ] = config(process.env.NODE_ENV || 'development');
const log = createDebugger('wndlr:server');
log.enabled = true;
const isDev = process.env.NODE_ENV !== 'production';
const compiler = webpack(clientConfig);

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
app.use(webpackHotMiddleware(compiler));
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: clientConfig.output.publicPath,
    heartbeat: 10 * 1000,
  }),
);
app.use(express.static('dist'));
app.get('/', (req, res) => res.send(renderHtml({ message: 'hello wndlr' })));

app.listen(app.get('port'), () => {
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
