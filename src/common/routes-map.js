import { types } from './redux';
import routes from './routes';

export default {
  [types.onRouteHome]: '/',
  ...routes,
};
