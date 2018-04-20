// @flow
import Auth from '../Auth';
import { ns as authNS, routesMap as authRoutes } from '../Auth/redux';

export default {
  ...authRoutes,
};

export const nsToComponent = {
  [authNS]: Auth,
};
