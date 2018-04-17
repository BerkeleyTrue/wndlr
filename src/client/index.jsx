import isDev from 'isdev';
import createDebugger from 'debug';
import createHistory from 'history/createBrowserHistory';

import render from './render.js';
import { createApp } from '../common';

const hotReloadTimeout = 2000;
const log = createDebugger('wndlr:client');

const {
  devToolsExtension,
  location,
  document,
  __wndlr__: {
    data: defaultState = {},
  } = {},
} = window;

const history = createHistory();
const DOMContainer = document.getElementById('app');

createApp({
  history,
  location,
  defaultState,
  enhancer: isDev && devToolsExtension && devToolsExtension(),
})
  .do(() => {
    if (module.hot && typeof module.hot.accept === 'function') {
      module.hot.accept(() => {
        log('hot reached root component');
        log('reloading the page to get latest updates');
        // saveToColdStorage(store.getState());
        setTimeout(() => location.reload(), hotReloadTimeout);
      });
    }
  })
  .switchMap(({ appElement }) => render(appElement, DOMContainer))
  .subscribe(() => log('app mounted'));
