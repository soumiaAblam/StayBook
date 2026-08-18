import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LOCAL_STORAGE, STORAGE_KEYS } from '../storage';
import { type LocalAccount } from './auth.models';
import { LocalAccountRepository } from './local-account.repository';

const account: LocalAccount = {
  id: 'account-1',
  email: 'owner@example.com',
  displayName: 'StayBook Owner',
  password: 'demo-password',
};

describe('LocalAccountRepository', () => {
  let repository: LocalAccountRepository;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: LOCAL_STORAGE, useValue: localStorage }],
    });
    repository = TestBed.inject(LocalAccountRepository);
  });

  it('stores minimal validated account records in local storage', () => {
    expect(repository.add(account).ok).toBe(true);
    expect(repository.findByEmail(' OWNER@EXAMPLE.COM ')).toEqual({
      ok: true,
      value: account,
    });
    expect(repository.findById('account-1')).toEqual({ ok: true, value: account });

    const persistedValue = localStorage.getItem(STORAGE_KEYS.accounts) ?? '';
    expect(persistedValue).toContain('password');
    expect(persistedValue).toContain('demo-password');
  });

  it('rejects duplicate identities while accepting the demo plain-text password field', () => {
    expect(repository.add(account).ok).toBe(true);
    expect(repository.add({ ...account, id: 'account-2' })).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: STORAGE_KEYS.accounts },
    });

    const secondAccount = {
      ...account,
      id: 'account-3',
      email: 'another@example.com',
      password: 'demo-password-2',
    };
    expect(repository.add(secondAccount as LocalAccount)).toEqual({ ok: true, value: undefined });
    expect(localStorage.getItem(STORAGE_KEYS.accounts)).toContain('demo-password-2');
  });

  it('replaces a stale account when the fixture identity changes', () => {
    expect(repository.add({ ...account, email: 'old-demo@example.com', id: 'account-old' }).ok).toBe(
      true,
    );
    expect(repository.replace({ ...account, id: 'account-old', email: 'demo@demo.com' })).toEqual({
      ok: true,
      value: undefined,
    });
    expect(repository.findById('account-old')).toEqual({
      ok: true,
      value: { ...account, id: 'account-old', email: 'demo@demo.com' },
    });
  });

  it('does not replace a corrupt account collection with an empty one', () => {
    localStorage.setItem(STORAGE_KEYS.accounts, '{corrupt');

    expect(repository.list()).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: STORAGE_KEYS.accounts },
    });
    expect(repository.add(account)).toEqual({
      ok: false,
      error: { code: 'invalid-data', key: STORAGE_KEYS.accounts },
    });
    expect(localStorage.getItem(STORAGE_KEYS.accounts)).toBe('{corrupt');
  });
});
