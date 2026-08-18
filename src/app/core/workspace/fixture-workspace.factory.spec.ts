import { calculatePropertyCompletion } from '../../domain/property';
import { describe, expect, it } from 'vitest';
import {
  createFixtureWorkspace,
  FIXTURE_ACCOUNT_ID,
  FIXTURE_PROPERTY_IDS,
} from './fixture-workspace.factory';
import { isAccountWorkspace } from './workspace.decoder';

describe('createFixtureWorkspace', () => {
  it('creates exactly three valid fictional properties in distinct completion states', () => {
    const workspace = createFixtureWorkspace(new Date('2026-08-13T12:00:00.000Z'));
    const completion = workspace.properties.map(calculatePropertyCompletion);

    expect(isAccountWorkspace(workspace)).toBe(true);
    expect(workspace.profile.accountId).toBe(FIXTURE_ACCOUNT_ID);
    expect(workspace.properties.map((property) => property.id)).toEqual(FIXTURE_PROPERTY_IDS);
    expect(workspace.properties).toHaveLength(3);
    expect(completion[0]?.complete).toBe(true);
    expect(completion[1]?.complete).toBe(false);
    expect(completion[2]?.complete).toBe(false);
    expect(completion[1]?.percentage).toBeGreaterThan(completion[2]?.percentage ?? 100);
  });

  it('contains no Wi-Fi credentials or access codes', () => {
    const workspace = createFixtureWorkspace();

    for (const property of workspace.properties) {
      expect(property.homeEssentials.wifi).toBeNull();
      expect(property.arrivalAccess.homeAccess.doorCode).toBe('');
      expect(property.arrivalAccess.homeAccess.lockboxCode).toBe('');
      expect(property.ownerAccountId).toBe(FIXTURE_ACCOUNT_ID);
    }

    expect(workspace.profile.contactEmail.endsWith('.example')).toBe(true);
  });
});
