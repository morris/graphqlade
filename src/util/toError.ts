export function toError<TErrorExtensions = { status?: number }>(
  err: unknown
): Error & TErrorExtensions {
  return (
    err instanceof Error ? err : new Error(`Unknown error: ${err}`)
  ) as Error & TErrorExtensions;
}
