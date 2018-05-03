import { Observable } from 'rxjs';
import { Database } from 'arangojs';

import config from '../config.js';

export default function dataSource(app) {
  app.dataSource = {
    db: new Database({ url: config.db.url }),
    query(...args) {
      return Observable.defer(() => this.db.query(...args));
    },
  };
  app.dataSource.db.useDatabase(config.db.name);
}
