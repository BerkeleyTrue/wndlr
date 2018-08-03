// @flow
import { type $Application } from 'express';

import { default as addReactRoutes } from './React';
import { default as addGraphqlRoutes } from './Graphql';

export default (app: $Application): any =>
  [
    addReactRoutes,
    addGraphqlRoutes,
  ].map(fn => fn(app));
