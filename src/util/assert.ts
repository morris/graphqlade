export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (!condition) throw new TypeError(message ?? "Assertion failed");
}
