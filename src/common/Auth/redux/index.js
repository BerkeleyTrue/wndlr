import { createAction, createTypes } from 'redux-vertical';

const ns = 'auth';

export const types = createTypes([
  'onRouteSignIn',
  'onRouteSignUp',
], ns);

export const routesMap = {
  [types.onRouteSignIn]: '/sign-in',
  [types.onRouteSignUp]: '/sign-up',
};

export const onRouteSignIn = createAction(types.onRouteSignIn);
export const onRouteSignUp = createAction(types.onRouteSignUp);
