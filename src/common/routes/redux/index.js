import { isLocationAction } from 'redux-first-router';
import { addNS } from 'redux-vertical';
import { ns as authNS, routesMap as authRoutes } from '../../Auth/redux';

const ns = 'mainRouter';

export const mainRouterSelector = state => state[ns];

export default addNS(ns, function mainRouterReducer(
  state = 'NotFound',
  action,
) {
  if (!isLocationAction(action)) {
    return state;
  }
  if (authRoutes[action.type]) {
    return authNS;
  }
  return '';
});
