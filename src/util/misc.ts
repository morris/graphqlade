export async function canImportModule(name: string) {
  try {
    await import(name);

    return true;
  } catch (err) {
    return false;
  }
}

export function assertDefined<T>(
  input: T | null | undefined,
  message?: string
): asserts input is T {
  if (input === null || typeof input === "undefined") {
    throw new Error(message ?? "Unexpected undefined value");
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
