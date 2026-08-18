const STORAGE_NAMESPACE = 'staybook:v1';

function requireStorageSegment(segment: string, name: string): string {
  const normalizedSegment = segment.trim();

  if (!normalizedSegment) {
    throw new Error(`${name} must not be empty.`);
  }

  return encodeURIComponent(normalizedSegment);
}

export const STORAGE_KEYS = {
  locale: `${STORAGE_NAMESPACE}:locale`,
  accounts: `${STORAGE_NAMESPACE}:accounts`,
  authSession: `${STORAGE_NAMESPACE}:auth-session`,
  fixtureState: `${STORAGE_NAMESPACE}:fixture-state`,
  workspace: (accountId: string): string =>
    `${STORAGE_NAMESPACE}:workspace:${requireStorageSegment(accountId, 'Account ID')}`,
  guestChecklist: (propertyId: string): string =>
    `${STORAGE_NAMESPACE}:guest-checklist:${requireStorageSegment(propertyId, 'Property ID')}`,
} as const;
