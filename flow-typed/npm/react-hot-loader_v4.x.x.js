// @flow
declare module "react-hot-loader" {
  import type { ComponentType } from 'react';

  declare export function hot(
    module: any
  ): (comp: ComponentType<*>) => ComponentType<*>;
}
