import isDev from 'isdev';
import createDebugger from 'debug';
import createHistory from 'history/createBrowserHistory';
import { Subject, BehaviorSubject } from 'rxjs';
import { withLatestFrom, switchMap, tap } from 'rxjs/operators';

import render from './render.js';
import { ssrStateKey, createApp } from '../common';

const log = createDebugger('wndlr:client');
const createRootKey = () => Math.random();

const {
  devToolsExtension,
  document,
  __wndlr__: { [ssrStateKey]: SSRState = {} } = {},
} = window;

const history = createHistory();
const DOMContainer = document.getElementById('app');
if (!DOMContainer) {
  throw new TypeError('Dom Container could not be found');
}

// We create a stream of the createApp function so that we can
// hot reload the function.
// We create a getState stream so that between hot reloads of
// the createApp function we can use the current state of the app
// instead of initial ssr state
const createApp$ = new Subject();
const getState = new BehaviorSubject(() => SSRState);

createApp$
  .pipe(
    withLatestFrom(getState),
    switchMap(
      ([
        // this callback will be called when every a new createApp function
        // is passed to the createApp$ stream
        // This will then grab the latest getState function will allow us to
        // access the latest state of the app
        createApp,
        getState,
      ]) =>
        // this creates the app and returns the app element and redux store
        createApp({
          rootKey: createRootKey(),
          history,
          defaultState: getState(),
          enhancer:
            isDev && typeof devToolsExtension === 'function' ?
              devToolsExtension() :
              undefined,
        }),
    ),
    // as a side effect, we pass the newest getState function into the
    // behavior subject for later use during hot reload
    tap(({ store }) => getState.next(store.getState)),
    // we grab the app element created in createApp and render into the DOM
    // this render function wraps ReactDOM.render in an observable function
    // call
    switchMap(({ appElement }) => render(appElement, DOMContainer)),
  )
  .subscribe(() => log('app mounted'));

createApp$.next(createApp);

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept('../common', () => {
      log('hot reloading createApp');
      // a new createApp function had been found, hot reload that shizzle
      createApp$.next(require('../common').createApp);
    });
  }
}
