import createDebugger from 'debug';
import { iif, empty } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { renderToString } from 'react-dom/server';
import createHistory from 'history/createMemoryHistory';
import { NOT_FOUND } from 'redux-first-router';
import requireWatch from 'require-watch';

requireWatch(require.resolve('../common-to-server.js'));
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
    const { createApp, ssrStateKey } = require('../common-to-server.js');
    const { originalUrl } = req;
    createApp({
      history: createHistory({ initialEntries: [ originalUrl ] }),
    })
      .pipe(
        switchMap(
          ({ store, appElement, location: { type, kind, pathname } }) => {
            const ifNotRender = iif(
              () => type === NOT_FOUND,
              empty().pipe(
                tap(undefined, undefined, () => {
                  log(
                    `createApp tried to find ${originalUrl} but was not found`,
                  );
                  next();
                }),
              ),
              empty().pipe(
                tap(undefined, undefined, () => {
                  log(`createApp found a redirect to ${pathname}`);
                  res.redirect(pathname);
                }),
              ),
            );
            return iif(
              () => type === NOT_FOUND || kind === 'redirect',
              ifNotRender,
              empty().pipe(
                tap(undefined, undefined, () => {
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
              ),
            );
          },
        ),
      )
      .subscribe(undefined, next);
  });
}
