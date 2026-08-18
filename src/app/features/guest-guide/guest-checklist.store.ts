import { inject, Injectable } from '@angular/core';
import { SESSION_STORAGE, STORAGE_KEYS } from '../../core/storage';

const CHECKLIST_SCHEMA_VERSION = 1 as const;
const MAXIMUM_CHECKED_ITEMS = 100;

interface StoredGuestChecklist {
  readonly schemaVersion: typeof CHECKLIST_SCHEMA_VERSION;
  readonly checkedItemIds: readonly string[];
}

function isStoredGuestChecklist(value: unknown): value is StoredGuestChecklist {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    record['schemaVersion'] === CHECKLIST_SCHEMA_VERSION &&
    Array.isArray(record['checkedItemIds']) &&
    record['checkedItemIds'].length <= MAXIMUM_CHECKED_ITEMS &&
    record['checkedItemIds'].every(
      (itemId) => typeof itemId === 'string' && itemId.length > 0 && itemId.length <= 128,
    )
  );
}

@Injectable({ providedIn: 'root' })
export class GuestChecklistStore {
  private readonly storage = inject(SESSION_STORAGE);
  private readonly memoryFallback = new Map<string, readonly string[]>();

  read(propertyId: string, allowedItemIds: readonly string[]): ReadonlySet<string> {
    const key = STORAGE_KEYS.guestChecklist(propertyId);
    const allowed = new Set(allowedItemIds);
    let checkedItemIds = this.memoryFallback.get(key) ?? [];

    try {
      const storedValue = this.storage?.getItem(key);
      if (storedValue) {
        const parsed: unknown = JSON.parse(storedValue);
        checkedItemIds = isStoredGuestChecklist(parsed) ? parsed.checkedItemIds : [];
      }
    } catch {
      // The in-memory fallback keeps the checklist useful when storage is unavailable.
    }

    return new Set(checkedItemIds.filter((itemId) => allowed.has(itemId)));
  }

  write(propertyId: string, checkedItemIds: ReadonlySet<string>): void {
    const key = STORAGE_KEYS.guestChecklist(propertyId);
    const normalizedIds = [...checkedItemIds].slice(0, MAXIMUM_CHECKED_ITEMS);
    const payload: StoredGuestChecklist = {
      schemaVersion: CHECKLIST_SCHEMA_VERSION,
      checkedItemIds: normalizedIds,
    };

    this.memoryFallback.set(key, normalizedIds);

    try {
      this.storage?.setItem(key, JSON.stringify(payload));
    } catch {
      // Ticking an item still works for the current runtime through the fallback.
    }
  }
}
