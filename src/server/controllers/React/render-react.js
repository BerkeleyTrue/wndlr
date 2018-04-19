import createDebugger from 'debug';
import { Observable } from 'rxjs';
import { renderToString } from 'react-dom/server';
import createHistory from 'history/createMemoryHistory';
import { NOT_FOUND } from 'redux-first-router';
import requireWatch from 'require-watch';

requireWatch(require.resolve('../../common-to-server.js'));
const log = createDebugger('wndlr:server:controllers:React:render');
const renderHtml = ({ markup, state }) => `
<!doctype html>
<html>
  <head>
    <title>wndlr</title>
  </head>
  <body>
    <div id='app'>${markup}</div>
    <script>${state}</script>
    <script src='/js/bundle.js' type='application/javascript'></script>
  </body>
</html>
`;

export default function renderReact(app) {
  app.get('*', (req, res, next) => {
    const { createApp, ssrStateKey } = require('../../common-to-server.js');
    const { originalUrl } = req;
    createApp({
      history: createHistory({ initialEntries: [ originalUrl ] }),
    })
      .switchMap(
        ({ store, appElement, location: { type, kind, pathname } }) => {
          const ifNotRender = Observable.if(
            () => type === NOT_FOUND,
            Observable.empty().do(null, null, () => {
              log(`createApp tried to find ${originalUrl} but was not found`);
              next();
            }),
            Observable.empty().do(null, null, () => {
              log(`createApp found a redirect to ${pathname}`);
              res.redirect(pathname);
            }),
          );
          return Observable.if(
            () => type === NOT_FOUND || kind === 'redirect',
            ifNotRender,
            Observable.empty().do(null, null, () => {
              log('rendering react page');
              const state = store.getState();
              // expose redux ssr state on window.__wndlr__.data
              res.expose(state, ssrStateKey, { isJSON: true });
              res.send(
                renderHtml({
                  markup: renderToString(appElement),
                  state: res.locals.state,
                }),
              );
            }),
          );
        },
      )
      .subscribe(null, next);
  });
}
