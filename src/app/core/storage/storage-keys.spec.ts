import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from './storage-keys';

describe('STORAGE_KEYS', () => {
  it('keeps local and session data under the approved v1 namespace', () => {
    expect(STORAGE_KEYS.locale).toBe('staybook:v1:locale');
    expect(STORAGE_KEYS.accounts).toBe('staybook:v1:accounts');
    expect(STORAGE_KEYS.authSession).toBe('staybook:v1:auth-session');
    expect(STORAGE_KEYS.fixtureState).toBe('staybook:v1:fixture-state');
    expect(STORAGE_KEYS.workspace('account-1')).toBe('staybook:v1:workspace:account-1');
    expect(STORAGE_KEYS.guestChecklist('property-1')).toBe(
      'staybook:v1:guest-checklist:property-1',
    );
  });

  it('rejects empty dynamic key segments and encodes separators', () => {
    expect(() => STORAGE_KEYS.workspace('   ')).toThrow('Account ID must not be empty.');
    expect(STORAGE_KEYS.workspace('account:1')).toBe('staybook:v1:workspace:account%3A1');
  });
});
