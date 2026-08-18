import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthSessionRepository } from '../auth';
import { SESSION_STORAGE, STORAGE_KEYS } from '../storage';
import { AccountWorkspaceRepository } from './account-workspace.repository';
import { createDefaultProperty } from './default-property.factory';
import { FIXTURE_ACCOUNT_ID } from './fixture-workspace.factory';

function profileFor(accountId: string) {
  return {
    accountId,
    displayName: `Owner ${accountId}`,
    contactEmail: `${accountId}@example.test`,
    contactPhone: '',
    photoDataUrl: null,
  } as const;
}

describe('AccountWorkspaceRepository', () => {
  let authSessionRepository: AuthSessionRepository;
  let repository: AccountWorkspaceRepository;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: SESSION_STORAGE, useValue: sessionStorage }],
    });
    authSessionRepository = TestBed.inject(AuthSessionRepository);
    repository = TestBed.inject(AccountWorkspaceRepository);
  });

  it('initializes a new account with an empty workspace', () => {
    authSessionRepository.start('account-1', new Date('2026-08-13T12:00:00.000Z'));

    expect(repository.initialize(profileFor('account-1'))).toEqual({
      ok: true,
      value: {
        schemaVersion: 1,
        profile: profileFor('account-1'),
        properties: [],
      },
    });
    expect(repository.listProperties()).toEqual({ ok: true, value: [] });
  });

  it('isolates workspaces by the currently authenticated account', () => {
    authSessionRepository.start('account-1');
    repository.initialize(profileFor('account-1'));
    repository.upsertProperty(
      createDefaultProperty({ id: 'property-1', ownerAccountId: 'account-1' }),
    );

    authSessionRepository.start('account-2');
    repository.initialize(profileFor('account-2'));
    expect(repository.listProperties()).toEqual({ ok: true, value: [] });

    authSessionRepository.start('account-1');
    expect(repository.listProperties()).toMatchObject({
      ok: true,
      value: [{ id: 'property-1', ownerAccountId: 'account-1' }],
    });
    expect(sessionStorage.getItem(STORAGE_KEYS.workspace('account-2'))).not.toBeNull();
  });

  it('creates, updates, finds and deletes only properties owned by the current account', () => {
    authSessionRepository.start('account-1');
    repository.initialize(profileFor('account-1'));
    const property = createDefaultProperty({ id: 'property-1', ownerAccountId: 'account-1' });

    expect(repository.upsertProperty(property).ok).toBe(true);
    expect(repository.findProperty('property-1')).toEqual({ ok: true, value: property });

    const updated = {
      ...property,
      overview: { ...property.overview, name: 'Updated property' },
    };
    expect(repository.upsertProperty(updated).ok).toBe(true);
    expect(repository.findProperty('property-1')).toMatchObject({
      ok: true,
      value: { overview: { name: 'Updated property' } },
    });

    const foreignProperty = createDefaultProperty({
      id: 'property-2',
      ownerAccountId: 'account-2',
    });
    expect(repository.upsertProperty(foreignProperty)).toMatchObject({
      ok: false,
      error: { code: 'invalid-data' },
    });

    expect(repository.deleteProperty('property-1')).toMatchObject({
      ok: true,
      value: { properties: [] },
    });
  });

  it('fails safely without an authenticated account or with corrupt workspace data', () => {
    expect(repository.read()).toEqual({
      ok: false,
      error: { code: 'unavailable', key: STORAGE_KEYS.authSession },
    });

    authSessionRepository.start('account-1');
    sessionStorage.setItem(
      STORAGE_KEYS.workspace('account-1'),
      JSON.stringify({
        schemaVersion: 1,
        updatedAt: '2026-08-13T12:00:00.000Z',
        data: { schemaVersion: 1, injected: true },
      }),
    );

    expect(repository.read()).toMatchObject({
      ok: false,
      error: { code: 'invalid-data', key: STORAGE_KEYS.workspace('account-1') },
    });
  });

  it('seeds exactly three fixture properties once per tab session', () => {
    authSessionRepository.start(FIXTURE_ACCOUNT_ID);

    expect(repository.seedFixtureForCurrentAccount(new Date('2026-08-13T12:00:00.000Z'))).toEqual({
      ok: true,
      value: { seeded: true, reason: 'seeded' },
    });
    expect(repository.listProperties()).toMatchObject({
      ok: true,
      value: [{}, {}, {}],
    });

    const properties = repository.listProperties();
    if (!properties.ok) {
      throw new Error('Expected fixture properties to be readable.');
    }
    for (const property of properties.value) {
      repository.deleteProperty(property.id);
    }

    expect(repository.seedFixtureForCurrentAccount()).toEqual({
      ok: true,
      value: { seeded: false, reason: 'already-seeded' },
    });
    expect(repository.listProperties()).toEqual({ ok: true, value: [] });
  });

  it('never seeds fixtures for a normal account or overwrites an existing fixture workspace', () => {
    authSessionRepository.start('account-1');
    repository.initialize(profileFor('account-1'));
    expect(repository.seedFixtureForCurrentAccount()).toMatchObject({
      ok: false,
      error: { code: 'invalid-data', key: STORAGE_KEYS.fixtureState },
    });

    authSessionRepository.start(FIXTURE_ACCOUNT_ID);
    repository.initialize(profileFor(FIXTURE_ACCOUNT_ID));
    repository.upsertProperty(
      createDefaultProperty({
        id: 'custom-fixture-property',
        ownerAccountId: FIXTURE_ACCOUNT_ID,
      }),
    );

    expect(repository.seedFixtureForCurrentAccount()).toEqual({
      ok: true,
      value: { seeded: false, reason: 'existing-workspace' },
    });
    expect(repository.listProperties()).toMatchObject({
      ok: true,
      value: [{ id: 'custom-fixture-property' }],
    });
  });
});
