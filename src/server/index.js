import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import createDebugger from 'debug';

const log = createDebugger('wndlr:server');
const isDev = process.env.NODE_ENV !== 'production';
log.enabled = true;

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
app.use(express.static('dist'));
app.get('/', (req, res) => res.send(renderHtml({ message: 'hello wndlr' })));

app.listen(app.get('port'), () => {
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
