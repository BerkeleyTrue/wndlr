import { isLocationAction } from 'redux-first-router';
import { addNS } from 'redux-vertical';
import { ns as homeNS, routesMap as homeRoutes } from '../../Home/redux';
import { ns as authNS, routesMap as authRoutes } from '../../Auth/redux';

export const ns = 'mainRouter';

export const mainRouterSelector = state => state[ns];

export default addNS(ns, function mainRouterReducer(
  state = 'NotFound',
  action,
) {
  if (!isLocationAction(action)) {
    return state;
  }
  if (homeRoutes[action.type]) {
    return homeNS;
  }
  if (authRoutes[action.type]) {
    return authNS;
  }
  return '';
});
