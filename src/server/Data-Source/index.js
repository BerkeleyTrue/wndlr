import { defer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Database } from 'arangojs';

import { db as settings } from '../config.js';

const db = new Database({ url: settings.url });
db.useDatabase(settings.name);
db.useBasicAuth(settings.auth.user, settings.auth.password);

export const query = (aqlQuery) =>
  defer(() => db.query(aqlQuery));

export const queryOne = (aqlQuery) =>
  query(aqlQuery).pipe(concatMap(cur => cur.next()));
