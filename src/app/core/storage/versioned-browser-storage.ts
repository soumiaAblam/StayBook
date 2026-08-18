import {
  isRecord,
  isVersionedEnvelope,
  type SchemaValidator,
  type VersionedEnvelope,
} from './schema-validation';
import { storageFailure, storageSuccess, type StorageResult } from './storage-result';

const DEFAULT_MAXIMUM_BYTES = 5 * 1024 * 1024;

export interface VersionedBrowserStorageOptions {
  readonly schemaVersion?: number;
  readonly maximumBytes?: number;
  readonly now?: () => Date;
}

function serializedByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength;
  }

  return value.length * 2;
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export class VersionedBrowserStorage<T> {
  private readonly schemaVersion: number;
  private readonly maximumBytes: number;
  private readonly now: () => Date;

  constructor(
    private readonly storage: Storage | null,
    readonly key: string,
    private readonly dataValidator: SchemaValidator<T>,
    options: VersionedBrowserStorageOptions = {},
  ) {
    this.schemaVersion = options.schemaVersion ?? 1;
    this.maximumBytes = options.maximumBytes ?? DEFAULT_MAXIMUM_BYTES;
    this.now = options.now ?? (() => new Date());
  }

  read(): StorageResult<T | null> {
    if (!this.storage) {
      return storageFailure('unavailable', this.key);
    }

    let serializedEnvelope: string | null;

    try {
      serializedEnvelope = this.storage.getItem(this.key);
    } catch {
      return storageFailure('unavailable', this.key);
    }

    if (serializedEnvelope === null) {
      return storageSuccess(null);
    }

    if (serializedByteLength(serializedEnvelope) > this.maximumBytes) {
      return storageFailure('too-large', this.key);
    }

    let candidate: unknown;

    try {
      candidate = JSON.parse(serializedEnvelope) as unknown;
    } catch {
      return storageFailure('invalid-data', this.key);
    }

    if (
      isRecord(candidate) &&
      typeof candidate['schemaVersion'] === 'number' &&
      candidate['schemaVersion'] !== this.schemaVersion
    ) {
      return storageFailure('unsupported-schema', this.key);
    }

    if (!isVersionedEnvelope(candidate, this.schemaVersion, this.dataValidator)) {
      return storageFailure('invalid-data', this.key);
    }

    return storageSuccess(candidate.data);
  }

  write(data: T): StorageResult<void> {
    if (!this.storage) {
      return storageFailure('unavailable', this.key);
    }

    if (!this.dataValidator(data)) {
      return storageFailure('invalid-data', this.key);
    }

    const envelope: VersionedEnvelope<T> = {
      schemaVersion: this.schemaVersion,
      updatedAt: this.now().toISOString(),
      data,
    };

    let serializedEnvelope: string;

    try {
      serializedEnvelope = JSON.stringify(envelope);
    } catch {
      return storageFailure('serialization-failed', this.key);
    }

    if (serializedByteLength(serializedEnvelope) > this.maximumBytes) {
      return storageFailure('too-large', this.key);
    }

    try {
      this.storage.setItem(this.key, serializedEnvelope);
      return storageSuccess(undefined);
    } catch (error: unknown) {
      return storageFailure(isQuotaExceeded(error) ? 'quota-exceeded' : 'unavailable', this.key);
    }
  }

  remove(): StorageResult<void> {
    if (!this.storage) {
      return storageFailure('unavailable', this.key);
    }

    try {
      this.storage.removeItem(this.key);
      return storageSuccess(undefined);
    } catch {
      return storageFailure('unavailable', this.key);
    }
  }
}
