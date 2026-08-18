export type StorageFailureCode =
  | 'invalid-data'
  | 'quota-exceeded'
  | 'serialization-failed'
  | 'too-large'
  | 'unavailable'
  | 'unsupported-schema';

export interface StorageFailure {
  readonly code: StorageFailureCode;
  readonly key: string;
}

export type StorageResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: StorageFailure };

export function storageSuccess<T>(value: T): StorageResult<T> {
  return { ok: true, value };
}

export function storageFailure<T>(code: StorageFailureCode, key: string): StorageResult<T> {
  return { ok: false, error: { code, key } };
}
