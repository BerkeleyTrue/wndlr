import * as R from 'ramda';
import { default as addReactRoutes } from './React';
import { default as addGraphqlRoutes } from './Graphql';

export default R.pipe(
  R.applyTo,
  R.forEach(R.__, [
    addReactRoutes,
    addGraphqlRoutes,
  ]),
);
