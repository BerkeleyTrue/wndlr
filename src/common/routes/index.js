// @flow
import type { ComponentType } from 'react';

import Home from '../Home';
import { ns as homeNS, routesMap as homeRoutes } from '../Home/redux';
import Auth from '../Auth';
import { ns as authNS, routesMap as authRoutes } from '../Auth/redux';

export default {
  ...homeRoutes,
  ...authRoutes,
};

type NSToComponent = {
  [ns: string]: ComponentType<*>
}
export const nsToComponent: NSToComponent = {
  [homeNS]: Home,
  [authNS]: Auth,
};
