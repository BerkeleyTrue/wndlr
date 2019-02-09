import { composeReducers, createAction, createTypes } from 'redux-vertical';
import { combineForms } from 'react-redux-form';

export const ns = 'auth';

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

export const formModels = {
  user: {
    email: '',
  },
};

export default composeReducers(ns, combineForms(formModels, ns));
