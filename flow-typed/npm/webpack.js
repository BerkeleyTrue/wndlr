// @flow
declare type ModuleHotStatus =
  // The process is waiting for a call to check (see below)
  | 'idle'
  // The process is checking for updates
  | 'check'
  // The process is getting ready for the update
  // (e.g. downloading the updated module)
  | 'prepare'
  // The update is prepared and available
  | 'ready'
  // The process is calling the dispose handlers on
  // the modules that will be replaced
  | 'dispose'
  // The process is calling the accept handlers and
  // re-executing self-accepted modules
  | 'apply'
  // An update was aborted, but the system is still in it's previous state
  | 'abort'
  // An update has thrown an exception and the system's
  // state has been compromised
  | 'fail'
  ;

declare type ModuleHotStatusHandler = (status: ModuleHotStatus) => any

declare interface ModuleHot {
  data: any;
  accept(paths?: string | Array<string>, callback?: () => any): void;
  decline(paths?: string | Array<string>): void;
  dispose(callback: (data?: mixed) => any): void;
  addDisposeHandler(callback: (data: mixed) => any): void;
  status(): ModuleHotStatus;
  check(autoApply: boolean | Object): Promise<string[]>;
  apply(options: Object): Promise<string[]>;
  addStatusHandler(callback: ModuleHotStatusHandler): void;
  removeStatusHandler(callback: ModuleHotStatusHandler): void;
}

declare var module: {
  hot?: ModuleHot,
};
