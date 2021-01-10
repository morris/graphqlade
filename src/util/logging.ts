export interface LoggerLike {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}
