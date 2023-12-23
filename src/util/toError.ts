// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toError(err: any): Error {
  if (
    err &&
    typeof err === 'object' &&
    typeof err.message === 'string' &&
    typeof err.stack === 'string'
  ) {
    return err;
  }

  return new Error(`Unknown error: ${JSON.stringify(err)}`);
}
