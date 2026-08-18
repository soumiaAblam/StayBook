import type { SchemaValidator } from './schema-validation';
import type { StorageResult } from './storage-result';
import { STORAGE_KEYS } from './storage-keys';
import { VersionedBrowserStorage } from './versioned-browser-storage';

const WORKSPACE_MAXIMUM_BYTES = 5 * 1024 * 1024;

export class SessionWorkspaceRepository<T> {
  private readonly adapter: VersionedBrowserStorage<T>;

  constructor(sessionStorage: Storage | null, accountId: string, validator: SchemaValidator<T>) {
    this.adapter = new VersionedBrowserStorage(
      sessionStorage,
      STORAGE_KEYS.workspace(accountId),
      validator,
      { maximumBytes: WORKSPACE_MAXIMUM_BYTES },
    );
  }

  read(): StorageResult<T | null> {
    return this.adapter.read();
  }

  save(workspace: T): StorageResult<void> {
    return this.adapter.write(workspace);
  }

  clear(): StorageResult<void> {
    return this.adapter.remove();
  }
}
