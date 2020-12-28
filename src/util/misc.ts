export async function canImportModule(name: string) {
  try {
    await import(name);

    return true;
  } catch (err) {
    return false;
  }
}

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
