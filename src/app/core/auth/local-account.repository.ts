import { inject, Injectable } from '@angular/core';
import {
  LOCAL_STORAGE,
  STORAGE_KEYS,
  VersionedBrowserStorage,
  storageFailure,
  storageSuccess,
  type StorageResult,
} from '../storage';
import type { LocalAccount } from './auth.models';
import {
  isLocalAccount,
  isLocalAccountCollection,
  normalizeEmail,
  type LocalAccountCollection,
} from './auth-validation';

const ACCOUNTS_MAXIMUM_BYTES = 256 * 1024;

@Injectable({ providedIn: 'root' })
export class LocalAccountRepository {
  private readonly localStorage = inject(LOCAL_STORAGE);
  private readonly adapter: VersionedBrowserStorage<LocalAccountCollection>;

  constructor() {
    this.adapter = new VersionedBrowserStorage(
      this.localStorage,
      STORAGE_KEYS.accounts,
      isLocalAccountCollection,
      { maximumBytes: ACCOUNTS_MAXIMUM_BYTES },
    );
  }

  list(): StorageResult<readonly LocalAccount[]> {
    const result = this.adapter.read();

    if (!result.ok) {
      return result;
    }

    return storageSuccess(result.value?.accounts ?? []);
  }

  findByEmail(email: string): StorageResult<LocalAccount | null> {
    const accountsResult = this.list();

    if (!accountsResult.ok) {
      return accountsResult;
    }

    const normalizedEmail = normalizeEmail(email);

    return storageSuccess(
      accountsResult.value.find((account) => account.email === normalizedEmail) ?? null,
    );
  }

  findById(accountId: string): StorageResult<LocalAccount | null> {
    const accountsResult = this.list();

    if (!accountsResult.ok) {
      return accountsResult;
    }

    return storageSuccess(accountsResult.value.find((account) => account.id === accountId) ?? null);
  }

  add(account: LocalAccount): StorageResult<void> {
    if (!isLocalAccount(account)) {
      return storageFailure('invalid-data', STORAGE_KEYS.accounts);
    }

    const accountsResult = this.list();

    if (!accountsResult.ok) {
      return accountsResult;
    }

    const hasConflict = accountsResult.value.some(
      (candidate) => candidate.id === account.id || candidate.email === account.email,
    );

    if (hasConflict) {
      return storageFailure('invalid-data', STORAGE_KEYS.accounts);
    }

    return this.adapter.write({ accounts: [...accountsResult.value, account] });
  }

  replace(account: LocalAccount): StorageResult<void> {
    if (!isLocalAccount(account)) {
      return storageFailure('invalid-data', STORAGE_KEYS.accounts);
    }

    const accountsResult = this.list();

    if (!accountsResult.ok) {
      return accountsResult;
    }

    const nextAccounts = accountsResult.value.filter(
      (candidate) => candidate.id !== account.id && candidate.email !== account.email,
    );

    return this.adapter.write({ accounts: [...nextAccounts, account] });
  }
}
