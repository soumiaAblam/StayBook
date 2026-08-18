import { describe, expect, it } from 'vitest';
import { isRecord } from './schema-validation';
import { SessionWorkspaceRepository } from './session-workspace.repository';
import { STORAGE_KEYS } from './storage-keys';

const isWorkspace = (value: unknown): value is { readonly propertyIds: readonly string[] } =>
  isRecord(value) &&
  Object.keys(value).length === 1 &&
  Array.isArray(value['propertyIds']) &&
  value['propertyIds'].every((item) => typeof item === 'string');

describe('SessionWorkspaceRepository', () => {
  it('isolates workspaces by account in session storage', () => {
    const repository = new SessionWorkspaceRepository(sessionStorage, 'account-1', isWorkspace);

    expect(repository.save({ propertyIds: ['property-1'] }).ok).toBe(true);
    expect(repository.read()).toEqual({
      ok: true,
      value: { propertyIds: ['property-1'] },
    });
    expect(sessionStorage.getItem(STORAGE_KEYS.accounts)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.workspace('account-1'))).not.toBeNull();

    repository.clear();
    expect(repository.read()).toEqual({ ok: true, value: null });
  });
});
