export function assertRecord(
  value: unknown,
  message?: string
): asserts value is Record<string, unknown> {
  const m = message ?? "Expected record";

  assert(value !== null, m);
  assert(typeof value === "object", m);
  assert(!Array.isArray(value), m);
}

export function assertDefined<T>(
  input: T | null | undefined,
  message?: string
): asserts input is T {
  assert(
    input !== null && typeof input !== "undefined",
    message ?? "Unexpected null/undefined value"
  );
}

export function assert(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) throw new TypeError(message ?? "Assertion failed");
}
