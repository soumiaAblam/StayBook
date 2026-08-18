import { inject, Injectable } from '@angular/core';
import {
  SESSION_STORAGE,
  STORAGE_KEYS,
  VersionedBrowserStorage,
  type StorageResult,
} from '../storage';
import type { AuthSession } from './auth.models';
import { isAuthSession } from './auth-validation';

@Injectable({ providedIn: 'root' })
export class AuthSessionRepository {
  private readonly sessionStorage = inject(SESSION_STORAGE);
  private readonly adapter: VersionedBrowserStorage<AuthSession>;

  constructor() {
    this.adapter = new VersionedBrowserStorage(
      this.sessionStorage,
      STORAGE_KEYS.authSession,
      isAuthSession,
      { maximumBytes: 8 * 1024 },
    );
  }

  read(): StorageResult<AuthSession | null> {
    return this.adapter.read();
  }

  start(accountId: string, authenticatedAt = new Date()): StorageResult<AuthSession> {
    const session: AuthSession = {
      accountId,
      authenticatedAt: authenticatedAt.toISOString(),
    };
    const writeResult = this.adapter.write(session);

    return writeResult.ok ? { ok: true, value: session } : writeResult;
  }

  clear(): StorageResult<void> {
    return this.adapter.remove();
  }
}
