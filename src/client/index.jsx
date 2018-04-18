import isDev from 'isdev';
import createDebugger from 'debug';
import createHistory from 'history/createBrowserHistory';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import render from './render.js';
import { createApp } from '../common';

const hotReloadTimeout = 2000;
const log = createDebugger('wndlr:client');
const createRootKey = () => Math.random();

const {
  devToolsExtension,
  location,
  document,
  __wndlr__: { data: ssrState = {} } = {},
} = window;

const history = createHistory();
const DOMContainer = document.getElementById('app');

// We create a stream of the createApp function so that we can
// hot reload the function.
// We create a getState stream so that between hot reloads of
// the createApp function we can use the current state of the app
// instead of initial ssr state
const createApp$ = new Subject();
const getState = new BehaviorSubject(() => ssrState);

createApp$
  .withLatestFrom(getState)
  .switchMap(
    ([
      // this callback will be called when every a new createApp function
      // is passed to the createApp$ stream
      // This will then grab the latest getState function will allow us to
      // access the latest state of the app
      createApp,
      getState,
    ]) =>
      // this creates the app and returns the app react element and redux store
      createApp({
        rootKey: createRootKey(),
        history,
        defaultState: getState(),
        enhancer: isDev && devToolsExtension && devToolsExtension(),
      }),
  )
  // as a side effect, we pass the newest getState function into the
  // behavior subject for later use during hot reload
  .do(({ store }) => getState.next(store.getState))
  // we grab the app element created in createApp and render into the DOM
  // this render function wraps ReactDOM.render in an observable function
  // call
  .switchMap(({ appElement }) => render(appElement, DOMContainer))
  .subscribe(() => log('app mounted'));

createApp$.next(createApp);

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept('../common', () => {
      log('hot reloading createApp');
      // a new createApp function had been found, hot reload that shizzle
      createApp$.next(require('../common').createApp);
    });
    module.hot.accept(() => {
      // note: not sure this is every called with the above in place
      log('hot reached root component');
      log('reloading the page to get latest updates');
      // saveToColdStorage(store.getState());
      setTimeout(() => location.reload(), hotReloadTimeout);
    });
  }
}
