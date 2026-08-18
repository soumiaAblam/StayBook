import type { OwnerProfile } from '../../domain/account';
import type { Property } from '../../domain/property';

export const ACCOUNT_WORKSPACE_SCHEMA_VERSION = 1 as const;

export interface AccountWorkspace {
  readonly schemaVersion: typeof ACCOUNT_WORKSPACE_SCHEMA_VERSION;
  readonly profile: OwnerProfile;
  readonly properties: readonly Property[];
}

export function createEmptyAccountWorkspace(profile: OwnerProfile): AccountWorkspace {
  return {
    schemaVersion: ACCOUNT_WORKSPACE_SCHEMA_VERSION,
    profile,
    properties: [],
  };
}
