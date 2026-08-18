import { inject, Injectable } from '@angular/core';
import type { OwnerProfile } from '../../domain/account';
import type { Property, PropertyId } from '../../domain/property';
import { AuthSessionRepository } from '../auth';
import {
  isRecord,
  LOCAL_STORAGE,
  SESSION_STORAGE,
  SessionWorkspaceRepository,
  STORAGE_KEYS,
  storageFailure,
  storageSuccess,
  VersionedBrowserStorage,
  type StorageResult,
} from '../storage';
import { createEmptyAccountWorkspace, type AccountWorkspace } from './account-workspace.model';
import { createFixtureWorkspace, FIXTURE_ACCOUNT_ID } from './fixture-workspace.factory';
import { isAccountWorkspace, isOwnerProfile, WORKSPACE_LIMITS } from './workspace.decoder';

const FIXTURE_STATE_SCHEMA_VERSION = 1 as const;
const FIXTURE_STATE_MAXIMUM_BYTES = 8 * 1024;

interface FixtureSeedState {
  readonly schemaVersion: typeof FIXTURE_STATE_SCHEMA_VERSION;
  readonly seededAccountIds: readonly string[];
}

export type FixtureSeedReason = 'already-seeded' | 'existing-workspace' | 'seeded';

export interface FixtureSeedOutcome {
  readonly reason: FixtureSeedReason;
  readonly seeded: boolean;
}

interface CurrentWorkspaceContext {
  readonly accountId: string;
  readonly repository: SessionWorkspaceRepository<AccountWorkspace>;
}

function createInitialFixtureSeedState(): FixtureSeedState {
  return {
    schemaVersion: FIXTURE_STATE_SCHEMA_VERSION,
    seededAccountIds: [],
  };
}

function isFixtureSeedState(value: unknown): value is FixtureSeedState {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    value['schemaVersion'] === FIXTURE_STATE_SCHEMA_VERSION &&
    Array.isArray(value['seededAccountIds']) &&
    value['seededAccountIds'].length <= 10 &&
    value['seededAccountIds'].every(
      (accountId) =>
        typeof accountId === 'string' && accountId.length > 0 && accountId.length <= 128,
    ) &&
    new Set(value['seededAccountIds']).size === value['seededAccountIds'].length
  );
}

@Injectable({ providedIn: 'root' })
export class AccountWorkspaceRepository {
  private readonly sessionStorage = inject(SESSION_STORAGE);
  private readonly localStorage = inject(LOCAL_STORAGE);
  private readonly authSessionRepository = inject(AuthSessionRepository);
  private readonly fixtureStateRepository = new VersionedBrowserStorage<FixtureSeedState>(
    this.sessionStorage,
    STORAGE_KEYS.fixtureState,
    isFixtureSeedState,
    { maximumBytes: FIXTURE_STATE_MAXIMUM_BYTES },
  );

  read(): StorageResult<AccountWorkspace | null> {
    const contextResult = this.currentContext();

    if (!contextResult.ok) {
      return contextResult;
    }

    const workspaceResult = contextResult.value.repository.read();
    if (workspaceResult.ok && workspaceResult.value !== null) {
      for (const property of workspaceResult.value.properties) {
        this.writeGuestPreview(property);
      }
    }

    return workspaceResult;
  }

  initialize(profile: OwnerProfile): StorageResult<AccountWorkspace> {
    const contextResult = this.currentContext();

    if (!contextResult.ok) {
      return contextResult;
    }

    const { accountId, repository } = contextResult.value;
    if (!isOwnerProfile(profile) || profile.accountId !== accountId) {
      return storageFailure('invalid-data', STORAGE_KEYS.workspace(accountId));
    }

    const existingResult = repository.read();
    if (!existingResult.ok) {
      return existingResult;
    }

    if (existingResult.value !== null) {
      return storageSuccess(existingResult.value);
    }

    const workspace = createEmptyAccountWorkspace(profile);
    const saveResult = repository.save(workspace);

    return saveResult.ok ? storageSuccess(workspace) : saveResult;
  }

  save(workspace: AccountWorkspace): StorageResult<AccountWorkspace> {
    const contextResult = this.currentContext();

    if (!contextResult.ok) {
      return contextResult;
    }

    const { accountId, repository } = contextResult.value;
    if (!isAccountWorkspace(workspace) || workspace.profile.accountId !== accountId) {
      return storageFailure('invalid-data', STORAGE_KEYS.workspace(accountId));
    }

    const saveResult = repository.save(workspace);
    if (!saveResult.ok) {
      return saveResult;
    }

    for (const property of workspace.properties) {
      this.writeGuestPreview(property);
    }

    return storageSuccess(workspace);
  }

  updateProfile(profile: OwnerProfile): StorageResult<AccountWorkspace> {
    const currentResult = this.read();

    if (!currentResult.ok) {
      return currentResult;
    }

    if (currentResult.value === null) {
      return this.initialize(profile);
    }

    return this.save({ ...currentResult.value, profile });
  }

  listProperties(): StorageResult<readonly Property[]> {
    const workspaceResult = this.read();

    if (!workspaceResult.ok) {
      return workspaceResult;
    }

    return storageSuccess(workspaceResult.value?.properties ?? []);
  }

  findProperty(propertyId: PropertyId): StorageResult<Property | null> {
    const propertiesResult = this.listProperties();

    if (!propertiesResult.ok) {
      const previewResult = this.readGuestPreview(propertyId);
      if (previewResult.ok && previewResult.value !== null) {
        return previewResult;
      }
      return propertiesResult;
    }

    const property = propertiesResult.value.find((candidate) => candidate.id === propertyId) ?? null;
    if (property !== null) {
      return storageSuccess(property);
    }

    return this.readGuestPreview(propertyId);
  }

  upsertProperty(property: Property): StorageResult<AccountWorkspace> {
    const workspaceResult = this.read();

    if (!workspaceResult.ok) {
      return workspaceResult;
    }

    if (workspaceResult.value === null) {
      const sessionResult = this.authSessionRepository.read();
      const key =
        sessionResult.ok && sessionResult.value
          ? STORAGE_KEYS.workspace(sessionResult.value.accountId)
          : STORAGE_KEYS.authSession;
      return storageFailure('invalid-data', key);
    }

    const workspace = workspaceResult.value;
    if (property.ownerAccountId !== workspace.profile.accountId) {
      return storageFailure('invalid-data', STORAGE_KEYS.workspace(workspace.profile.accountId));
    }

    const existingIndex = workspace.properties.findIndex(
      (candidate) => candidate.id === property.id,
    );
    let properties: readonly Property[];

    if (existingIndex === -1) {
      if (workspace.properties.length >= WORKSPACE_LIMITS.maximumProperties) {
        return storageFailure('too-large', STORAGE_KEYS.workspace(workspace.profile.accountId));
      }

      properties = [...workspace.properties, property];
    } else {
      properties = workspace.properties.map((candidate, index) =>
        index === existingIndex ? property : candidate,
      );
    }

    return this.save({ ...workspace, properties });
  }

  deleteProperty(propertyId: PropertyId): StorageResult<AccountWorkspace> {
    const workspaceResult = this.read();

    if (!workspaceResult.ok) {
      return workspaceResult;
    }

    if (workspaceResult.value === null) {
      const sessionResult = this.authSessionRepository.read();
      const key =
        sessionResult.ok && sessionResult.value
          ? STORAGE_KEYS.workspace(sessionResult.value.accountId)
          : STORAGE_KEYS.authSession;
      return storageFailure('invalid-data', key);
    }

    const nextWorkspace = {
      ...workspaceResult.value,
      properties: workspaceResult.value.properties.filter((property) => property.id !== propertyId),
    };
    const saveResult = this.save(nextWorkspace);
    if (saveResult.ok) {
      this.removeGuestPreview(propertyId);
    }
    return saveResult;
  }

  seedFixtureForCurrentAccount(now = new Date()): StorageResult<FixtureSeedOutcome> {
    const contextResult = this.currentContext();

    if (!contextResult.ok) {
      return contextResult;
    }

    const { accountId, repository } = contextResult.value;
    if (accountId !== FIXTURE_ACCOUNT_ID) {
      return storageFailure('invalid-data', STORAGE_KEYS.fixtureState);
    }

    const stateResult = this.readFixtureSeedState();
    if (!stateResult.ok) {
      return stateResult;
    }

    const state = stateResult.value;

    if (state.seededAccountIds.includes(accountId)) {
      return storageSuccess({ seeded: false, reason: 'already-seeded' });
    }

    const workspaceResult = this.readFixtureWorkspace(repository);
    if (!workspaceResult.ok) {
      return workspaceResult;
    }

    let outcome: FixtureSeedOutcome;
    if (workspaceResult.value !== null && workspaceResult.value.properties.length > 0) {
      outcome = { seeded: false, reason: 'existing-workspace' };
    } else {
      const saveResult = repository.save(createFixtureWorkspace(now));
      if (!saveResult.ok) {
        return saveResult;
      }
      outcome = { seeded: true, reason: 'seeded' };
    }

    const markerResult = this.fixtureStateRepository.write({
      ...state,
      seededAccountIds: [...state.seededAccountIds, accountId],
    });

    return markerResult.ok ? storageSuccess(outcome) : markerResult;
  }

  private readFixtureSeedState(): StorageResult<FixtureSeedState> {
    const stateResult = this.fixtureStateRepository.read();
    if (stateResult.ok) {
      return storageSuccess(stateResult.value ?? createInitialFixtureSeedState());
    }

    if (!['invalid-data', 'unsupported-schema'].includes(stateResult.error.code)) {
      return stateResult;
    }

    const resetResult = this.fixtureStateRepository.remove();
    if (!resetResult.ok) {
      return resetResult;
    }

    return storageSuccess(createInitialFixtureSeedState());
  }

  private readFixtureWorkspace(
    repository: SessionWorkspaceRepository<AccountWorkspace>,
  ): StorageResult<AccountWorkspace | null> {
    const workspaceResult = repository.read();
    if (workspaceResult.ok) {
      return workspaceResult;
    }

    if (!['invalid-data', 'unsupported-schema'].includes(workspaceResult.error.code)) {
      return workspaceResult;
    }

    const clearResult = repository.clear();
    if (!clearResult.ok) {
      return clearResult;
    }

    return storageSuccess(null);
  }

  private readGuestPreview(propertyId: PropertyId): StorageResult<Property | null> {
    if (!this.localStorage) {
      return storageSuccess(null);
    }

    const key = STORAGE_KEYS.guestPreview(propertyId);
    const snapshot = this.localStorage.getItem(key);
    if (snapshot === null) {
      return storageSuccess(null);
    }

    try {
      const value = JSON.parse(snapshot) as Partial<Property>;
      if (!value || value.id !== propertyId || !value.ownerAccountId) {
        return storageSuccess(null);
      }
      return storageSuccess(value as Property);
    } catch {
      return storageSuccess(null);
    }
  }

  private writeGuestPreview(property: Property): void {
    if (!this.localStorage) {
      return;
    }

    try {
      this.localStorage.setItem(STORAGE_KEYS.guestPreview(property.id), JSON.stringify(property));
    } catch {
      // Ignore browser storage write failures for the guest-preview cache.
    }
  }

  private removeGuestPreview(propertyId: PropertyId): void {
    if (!this.localStorage) {
      return;
    }

    try {
      this.localStorage.removeItem(STORAGE_KEYS.guestPreview(propertyId));
    } catch {
      // Ignore browser storage write failures for the guest-preview cache.
    }
  }

  private currentContext(): StorageResult<CurrentWorkspaceContext> {
    const sessionResult = this.authSessionRepository.read();

    if (!sessionResult.ok) {
      return sessionResult;
    }

    if (sessionResult.value === null) {
      return storageFailure('unavailable', STORAGE_KEYS.authSession);
    }

    return storageSuccess({
      accountId: sessionResult.value.accountId,
      repository: new SessionWorkspaceRepository(
        this.sessionStorage,
        sessionResult.value.accountId,
        isAccountWorkspace,
      ),
    });
  }
}
