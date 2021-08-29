export function toError(err: unknown) {
  return err instanceof Error ? err : new Error(`Unknown error: ${err}`);
}
