import Home from '../Home';
import { ns as homeNS, routesMap as homeRoutes } from '../Home/redux';
import Auth from '../Auth';
import { ns as authNS, routesMap as authRoutes } from '../Auth/redux';

export default {
  ...homeRoutes,
  ...authRoutes,
};

export const nsToComponent = {
  [homeNS]: Home,
  [authNS]: Auth,
};
