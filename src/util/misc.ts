export function isAsyncIterator<T>(
  result: unknown
): result is AsyncIterator<T> {
  return typeof Object(result)[Symbol.asyncIterator] === "function";
}

export function compare<T>(a: T, b: T) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
