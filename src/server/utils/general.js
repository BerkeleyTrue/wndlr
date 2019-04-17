import { defer } from 'rxjs';

export const deferPromise =
  (fn) => (...args) => defer(() => fn(...args));
