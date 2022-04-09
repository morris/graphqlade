export interface LoggerLike {
  log: (message: string | Error) => unknown;
  warn: (message: string | Error) => unknown;
  error: (message: string | Error) => unknown;
}
