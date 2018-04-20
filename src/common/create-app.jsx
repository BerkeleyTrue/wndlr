// @flow
import _ from 'lodash';
import React from 'react';
import type { Element } from 'react';
import type { Observable } from 'rxjs';
import createDebugger from 'debug';
import { createStore, compose, applyMiddleware } from 'redux';
import type { Store } from 'redux';
import { Provider } from 'react-redux';
import type { BrowserHistory, MemoryHistory } from 'history';
import { selectLocationState, connectRoutes } from 'redux-first-router';
import type { Location } from 'redux-first-router';
import { of } from 'rxjs/observable/of';
import { addNS } from 'redux-vertical';

import App from './App.jsx';
import routesMap from './routes-map.js';
import createReducer from './create-reducer.js';

const log = createDebugger('wndlr:common:create-app');

type CreateAppReturn = {
  appElement: Element<any>,
  store: Store<any, any>,
  location: Location,
};
export default function createApp({
  // Note: root key is used to force react to render
  // a new tree on subsequent render(appElement) calls.
  // This prevents the Provider warning about the store object changing
  rootKey,
  history,
  defaultState,
  enhancer: sideEnhancer = _.identity,
}: {
  rootKey: number,
  enhancer: Function,
  defaultState: any,
  history: BrowserHistory | MemoryHistory,
}): Observable<CreateAppReturn> {
  const {
    reducer: routesReducer,
    middleware: routesMiddleware,
    enhancer: routesEnhancer,
  } = connectRoutes(history, routesMap);

  addNS('location', routesReducer);

  const enhancer = compose(
    routesEnhancer,
    applyMiddleware(routesMiddleware),
    sideEnhancer,
  );
  const reducer = createReducer(routesReducer);
  const store = createStore(reducer, defaultState, enhancer);
  const location = selectLocationState(store.getState());
  const appElement = (
    <Provider
      key={ rootKey }
      store={ store }
      >
      <App />
    </Provider>
  );

  if (process.env.NODE_ENV === 'development') {
    if (module.hot) {
      module.hot.accept('./create-reducer.js', () => {
        log('hot reloading reducers');
        store.replaceReducer(
          require('./create-reducer.js').default(routesReducer),
        );
      });
    }
  }
  return of({
    appElement,
    store,
    location,
  });
}
