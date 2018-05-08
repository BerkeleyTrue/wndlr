// @flow
declare module 'uuid2' {
  declare type UUID2 =
    | (number) => string
    | (number, (Error, number) => any) => any
  declare module.exports: UUID2
}
