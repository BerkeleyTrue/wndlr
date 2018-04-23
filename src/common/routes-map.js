// @flow
import { types } from './redux';
import routes from './routes';

export default {
  // $FlowFixMe
  [types.onRouteHome]: '/',
  ...routes,
};
