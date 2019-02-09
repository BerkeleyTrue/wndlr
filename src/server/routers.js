import { default as addReactRoutes } from './React';
import { default as addGraphqlRoutes } from './Graphql';

export default (app) =>
  [
    addReactRoutes,
    addGraphqlRoutes,
  ].map(fn => fn(app));
