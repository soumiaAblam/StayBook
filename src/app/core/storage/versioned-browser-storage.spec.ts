import { describe, expect, it } from 'vitest';
import { isBoundedString } from './schema-validation';
import { VersionedBrowserStorage } from './versioned-browser-storage';

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

const isShortString = (value: unknown): value is string => isBoundedString(value, 1, 20);

describe('VersionedBrowserStorage', () => {
  it('writes and reads a validated versioned envelope', () => {
    const storage = new MemoryStorage();
    const adapter = new VersionedBrowserStorage(storage, 'test:key', isShortString, {
      now: () => new Date('2026-08-13T12:00:00.000Z'),
    });

    expect(adapter.write('StayBook')).toEqual({ ok: true, value: undefined });
    expect(JSON.parse(storage.getItem('test:key') ?? '')).toEqual({
      schemaVersion: 1,
      updatedAt: '2026-08-13T12:00:00.000Z',
      data: 'StayBook',
    });
    expect(adapter.read()).toEqual({ ok: true, value: 'StayBook' });
  });

  it('returns a safe empty result when the key does not exist', () => {
    const adapter = new VersionedBrowserStorage(new MemoryStorage(), 'test:key', isShortString);

    expect(adapter.read()).toEqual({ ok: true, value: null });
  });

  it('rejects corrupt, unsupported, and unvalidated stored data', () => {
    const storage = new MemoryStorage();
    const adapter = new VersionedBrowserStorage(storage, 'test:key', isShortString);

    storage.setItem('test:key', '{not-json');
    expect(adapter.read()).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: 'test:key' },
    });

    storage.setItem(
      'test:key',
      JSON.stringify({
        schemaVersion: 2,
        updatedAt: '2026-08-13T12:00:00.000Z',
        data: 'StayBook',
      }),
    );
    expect(adapter.read()).toEqual({
      ok: false,
      error: { code: 'unsupported-schema', key: 'test:key' },
    });

    storage.setItem(
      'test:key',
      JSON.stringify({
        schemaVersion: 1,
        updatedAt: '2026-08-13T12:00:00.000Z',
        data: { injected: true },
      }),
    );
    expect(adapter.read()).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: 'test:key' },
    });
  });

  it('does not overwrite storage with invalid data or oversized payloads', () => {
    const storage = new MemoryStorage();
    const adapter = new VersionedBrowserStorage(storage, 'test:key', isShortString, {
      maximumBytes: 10,
    });

    expect(adapter.write('StayBook')).toEqual({
      ok: false,
      error: { code: 'too-large', key: 'test:key' },
    });
    expect(storage.getItem('test:key')).toBeNull();

    const unsafeAdapter = adapter as unknown as VersionedBrowserStorage<unknown>;
    expect(unsafeAdapter.write({ injected: true })).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: 'test:key' },
    });
  });

  it('classifies unavailable and quota-limited storage without throwing', () => {
    const unavailableAdapter = new VersionedBrowserStorage(null, 'test:key', isShortString);

    expect(unavailableAdapter.read()).toEqual({
      ok: false,
      error: { code: 'unavailable', key: 'test:key' },
    });

    const quotaStorage = new MemoryStorage();
    quotaStorage.setItem = (): never => {
      throw new DOMException('Storage quota reached.', 'QuotaExceededError');
    };
    const quotaAdapter = new VersionedBrowserStorage(quotaStorage, 'test:key', isShortString);

    expect(quotaAdapter.write('StayBook')).toEqual({
      ok: false,
      error: { code: 'quota-exceeded', key: 'test:key' },
    });
  });
});
