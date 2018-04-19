import { createAction, createTypes } from 'redux-vertical';

const ns = 'app';

export const types = createTypes([ 'onRouteHome' ], ns);

export const onRouteHome = createAction(types.onRouteHome);
