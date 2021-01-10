export function isAsyncIterator<T>(
  result: unknown
): result is AsyncIterator<T> {
  return typeof Object(result)[Symbol.asyncIterator] === "function";
}
