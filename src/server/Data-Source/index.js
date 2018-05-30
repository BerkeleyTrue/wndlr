// @flow
import { defer, type Observable } from 'rxjs';
import { Database } from 'arangojs';

import { db as settings } from '../config.js';

type AqlQuery = {
  query: string,
  bindVars: { [key: string]: any },
};

type Cursor<T> = {
  next(): Promise<T>,
};

export type DataSource = {
  query<T>(AqlQuery): Observable<Cursor<T>>,
  queryOne<T>(AqlQuery): Observable<T>,
};

const db = new Database({ url: settings.url });
db.useDatabase(settings.name);
db.useBasicAuth(settings.auth.user, settings.auth.password);

export const dataSource: DataSource = {
  query(aqlQuery) {
    return defer(() => db.query(aqlQuery));
  },
  queryOne(aqlQuery) {
    return this.query(aqlQuery).concatMap(cur => cur.next());
  },
};
