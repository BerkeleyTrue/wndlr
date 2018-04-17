import { createTypes } from 'redux-vertical';

const ns = 'auth';

export const types = createTypes([
  'onRouteSignIn',
  'onRouteSignUp',
], ns);
