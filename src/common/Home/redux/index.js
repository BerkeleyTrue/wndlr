// @flow
import { createTypes, createAction } from 'redux-vertical';

export const ns = 'home';

export const types = createTypes([ 'onRouteHome' ], ns);

export const routesMap = {
  // $FlowFixMe
  [types.onRouteHome]: '/',
};

export const onRouteHome = createAction(types.onRouteHome);
