import React from 'react';
import { createStore } from 'redux';
import { of } from 'rxjs/observable/of';
import { empty } from 'rxjs/observable/empty';

import App from './App.jsx';

export default function createApp({
  // history,
  location,
  defaultState,
  enhancer: sideEnhancer,
}) {
  const store = createStore(() => ({}), defaultState, sideEnhancer);
  return of({
    appElement: <App />,
    store,
    epic: () => empty(),
    location,
    notFound: false,
  });
}
