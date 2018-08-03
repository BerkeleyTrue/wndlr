// @flow
import React, { type Element } from 'react';
import createDebugger from 'debug';
import type { BrowserHistory, MemoryHistory } from 'history';
import {
  type Store,
  type StoreEnhancer,
  type Middleware,
  type Reducer,
  createStore,
  compose,
  applyMiddleware,
} from 'redux';
import { Provider } from 'react-redux';
import {
  type Location,
  selectLocationState,
  connectRoutes,
} from 'redux-first-router';
import { type Observable, of } from 'rxjs';
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
export default function createApp<
  E: StoreEnhancer<*, *>,
  M: Middleware<*, *>,
  Re: Reducer<*, *>,
>({
  // Note: root key is used to force react to render
  // a new tree on subsequent render(appElement) calls.
  // This prevents the Provider warning about the store object changing
  defaultState,
  enhancer: sideEnhancer = x => x,
  history,
  rootKey,
}: {
  defaultState: any,
  enhancer?: E,
  history: BrowserHistory | MemoryHistory,
  rootKey: number,
}): Observable<CreateAppReturn> {
  const {
    reducer: routesReducer,
    middleware: routesMiddleware,
    enhancer: routesEnhancer,
  }: {
    enhancer: E,
    middleware: M,
    reducer: Re,
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
