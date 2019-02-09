import { createTypes, createAction } from 'redux-vertical';

export const ns = 'home';

export const types = createTypes([ 'onRouteHome' ], ns);

export const routesMap = {
  [types.onRouteHome]: '/',
};

export const onRouteHome = createAction(types.onRouteHome);
