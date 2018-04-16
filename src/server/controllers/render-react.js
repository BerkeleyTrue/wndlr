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

export default function renderReact(app) {
  app.get('/', (req, res) => res.send(renderHtml({ message: 'hello wndlr' })));
}
