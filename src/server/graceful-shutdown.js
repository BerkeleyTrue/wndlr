import createDebugger from 'debug';
import { bindCallback, of, fromEvent, merge, Subject } from 'rxjs';
import {
  catchError,
  exhaustMap,
  mapTo,
  tap,
  takeUntil,
  timeout,
} from 'rxjs/operators';

const log = createDebugger('wndlr:graceful-shutdown');

export function gracefulShutdown(app, server) {
  const takeTillProxy = new Subject();
  const shutdownServer = bindCallback(server.close.bind(server));

  merge(
    // on signal to kill, close server
    fromEvent(process, 'SIGINT').pipe(mapTo('SIGINT')),
    fromEvent(process, 'SIGTERM').pipe(mapTo('SIGTERM')),
    // used by nodemon to restart on changes
    fromEvent(process, 'SIGUSR2').pipe(mapTo('SIGUSR2')),
  )
    .pipe(
      takeUntil(takeTillProxy),
      tap(sig => log(`${sig} signal received`)),
      // debounceTime(1000),
      exhaustMap(sig => {
        log('starting shutdown');
        return merge(
          shutdownServer().pipe(tap(() => log('Express server is closed'))),
        ).pipe(
          // prevent express uncompleted request from hanging shutdown process
          timeout(2000),
          catchError(err => {
            if (err.name === 'TimeoutError') {
              log('Express server shutdown timeout');
              return of(null);
            }
            throw err;
          }),
          mapTo(sig),
        );
      }),
    )
    .subscribe(
      sig => {
        takeTillProxy.next();
        log(`killing process with ${sig}`);
        process.kill(process.pid, sig);
      },
      err => {
        throw err;
      },
      () => log('shutdown complete'),
    );
}
