import React from 'react';
import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { selectLocationState, connectRoutes } from 'redux-first-router';
import { of } from 'rxjs/observable/of';
import { empty } from 'rxjs/observable/empty';
import { addNS, combineReducers } from 'redux-vertical';

import App from './App.jsx';
import routesMap from './routes-map.js';

export default function createApp({
  history,
  defaultState,
  enhancer: sideEnhancer,
}) {
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
  const reducer = combineReducers(routesReducer);
  const store = createStore(reducer, defaultState, enhancer);
  const location = selectLocationState(store.getState());
  const appElement = (
    <Provider store={ store }>
      <App />
    </Provider>
  );
  return of({
    appElement,
    store,
    epic: () => empty(),
    location,
    notFound: false,
  });
}
