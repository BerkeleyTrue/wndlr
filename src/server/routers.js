// @flow
import { type $Application } from 'express';
import _ from 'lodash/fp';

import { default as addReactRoutes } from './React';
import { default as addGraphqlRoutes } from './Graphql';

export default function addRouters(app: $Application) {
  _.forEach(f => f(app), [
    addReactRoutes,
    addGraphqlRoutes,
  ]);
}
