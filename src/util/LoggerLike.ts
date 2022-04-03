export interface LoggerLike {
  log: (message: string | Error) => void;
  warn: (message: string | Error) => void;
  error: (message: string | Error) => void;
}
