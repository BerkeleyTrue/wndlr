// @flow
declare module 'redux-verticals' {
  declare export type Action<ActionType: string, Payload: any, Meta: any> = {
    type: ActionType,
    payload?: Payload,
    meta?: Meta,
    error?: boolean,
  };
}
