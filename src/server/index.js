import 'dotenv/config';
import express from 'express';
import createDebugger from 'debug';

const log = createDebugger('wndlr:server');
const isDev = process.env.NODE_ENV !== 'production';
log.enabled = true;

const app = express();
app.set('port', process.env.PORT);

const renderHtml = ({ message }) => `
<html>
<head>
  <title>wndlr</title>
</head>
<body>
  <h1>${message}</h1>
</body>
`;

app.get('/', (req, res) => res.send(renderHtml({ message: 'hello wndlr' })));

app.listen(app.get('port'), () => {
  log(`server started on port ${app.get('port')}`);
  log(`server is in ${isDev ? 'dev' : 'prod'} mode`);
});
