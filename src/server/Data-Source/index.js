// @flow
import { defer, type Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Database } from 'arangojs';

import { db as settings } from '../config.js';

export type AqlQuery = {
  query: string,
  bindVars: { [key: string]: any },
};

type Cursor<T> = {
  next(): Promise<T>,
};

const db = new Database({ url: settings.url });
db.useDatabase(settings.name);
db.useBasicAuth(settings.auth.user, settings.auth.password);

export const query = (aqlQuery: AqlQuery): Observable<Cursor<*>> =>
  defer(() => db.query(aqlQuery));

export const queryOne = (aqlQuery: AqlQuery): Observable<*> =>
  query(aqlQuery).pipe(concatMap(cur => cur.next()));
