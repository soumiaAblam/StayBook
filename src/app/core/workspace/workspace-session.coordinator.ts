import { inject, Injectable } from '@angular/core';
import type { AccountSummary } from '../auth';
import { storageSuccess, type StorageResult } from '../storage';
import { AccountWorkspaceRepository } from './account-workspace.repository';
import { FIXTURE_ACCOUNT_ID } from './fixture-workspace.factory';

@Injectable({ providedIn: 'root' })
export class WorkspaceSessionCoordinator {
  private readonly workspaces = inject(AccountWorkspaceRepository);

  prepare(account: AccountSummary): StorageResult<void> {
    if (account.id === FIXTURE_ACCOUNT_ID) {
      const seedResult = this.workspaces.seedFixtureForCurrentAccount();
      return seedResult.ok ? storageSuccess(undefined) : seedResult;
    }

    const initializeResult = this.workspaces.initialize({
      accountId: account.id,
      displayName: account.displayName,
      contactEmail: account.email,
      contactPhone: '',
      photoDataUrl: null,
    });

    return initializeResult.ok ? storageSuccess(undefined) : initializeResult;
  }
}
