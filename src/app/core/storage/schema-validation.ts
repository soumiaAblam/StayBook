export type SchemaValidator<T> = (value: unknown) => value is T;

export interface VersionedEnvelope<T> {
  readonly schemaVersion: number;
  readonly updatedAt: string;
  readonly data: T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasExactlyKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value);

  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
}

export function isBoundedString(
  value: unknown,
  minimumLength: number,
  maximumLength: number,
): value is string {
  return (
    typeof value === 'string' && value.length >= minimumLength && value.length <= maximumLength
  );
}

export function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 40) {
    return false;
  }

  const parsedDate = new Date(value);

  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString() === value;
}

export function arrayOf<T>(
  itemValidator: SchemaValidator<T>,
  maximumItems = 1_000,
): SchemaValidator<readonly T[]> {
  return (value: unknown): value is readonly T[] =>
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((item) => itemValidator(item));
}

export function isVersionedEnvelope<T>(
  value: unknown,
  schemaVersion: number,
  dataValidator: SchemaValidator<T>,
): value is VersionedEnvelope<T> {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['schemaVersion', 'updatedAt', 'data']) &&
    value['schemaVersion'] === schemaVersion &&
    isIsoDateTime(value['updatedAt']) &&
    dataValidator(value['data'])
  );
}
