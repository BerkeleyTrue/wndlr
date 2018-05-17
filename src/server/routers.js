// @flow
import { type $Application } from 'express';
import R from 'ramda';

import { default as addReactRoutes } from './React';
import { default as addGraphqlRoutes } from './Graphql';

export default function addRouters(app: $Application) {
  R.forEach(R.applyTo(app), [
    addReactRoutes,
    addGraphqlRoutes,
  ]);
}
