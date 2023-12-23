export function defined<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new TypeError(message ?? 'Unexpected undefined value');
  }

  return value;
}
