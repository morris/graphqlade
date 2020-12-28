export function assertRecord(
  value: unknown,
  message?: string
): asserts value is Record<string, unknown> {
  const m = message ?? "Expected record";

  assertType(value !== null, m);
  assertType(typeof value === "object", m);
  assertType(!Array.isArray(value), m);
}

export function assertDefined<T>(
  input: T | null | undefined,
  message?: string
): asserts input is T {
  assertType(
    input !== null && typeof input !== "undefined",
    message ?? "Unexpected null/undefined value"
  );
}

export function assertType(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) throw new TypeError(message ?? "Assertion failed");
}
