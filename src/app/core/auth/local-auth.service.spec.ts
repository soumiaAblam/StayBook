import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LOCAL_STORAGE, SESSION_STORAGE, STORAGE_KEYS } from '../storage';
import { GENERIC_SIGN_IN_ERROR, LocalAuthService } from './local-auth.service';

describe('LocalAuthService', () => {
  let service: LocalAuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE, useValue: localStorage },
        { provide: SESSION_STORAGE, useValue: sessionStorage },
      ],
    });
    service = TestBed.inject(LocalAuthService);
  });

  it('registers a normalized persistent account and keeps the plain local password for demo login', async () => {
    const result = await service.register({
      email: ' OWNER@Example.COM ',
      displayName: '  Alex Owner  ',
      password: 'correct',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.account.email).toBe('owner@example.com');
      expect(result.account.displayName).toBe('Alex Owner');
    }
    const persistedAccounts = localStorage.getItem(STORAGE_KEYS.accounts) ?? '';
    expect(persistedAccounts).toContain('correct');
    expect(sessionStorage.getItem(STORAGE_KEYS.authSession)).toBeNull();
  });

  it('returns the same generic error for unknown accounts and wrong passwords', async () => {
    await service.register({
      email: 'owner@example.com',
      displayName: 'Alex Owner',
      password: 'correct',
    });

    const unknownAccountResult = await service.signIn({
      email: 'unknown@example.com',
      password: 'wrong',
    });
    const wrongPasswordResult = await service.signIn({
      email: 'owner@example.com',
      password: 'wrong',
    });

    expect(unknownAccountResult).toEqual({
      ok: false,
      code: 'invalid-credentials',
      message: GENERIC_SIGN_IN_ERROR,
    });
    expect(wrongPasswordResult).toEqual(unknownAccountResult);
  });

  it('creates and clears a session only after successful verification', async () => {
    await service.register({
      email: 'owner@example.com',
      displayName: 'Alex Owner',
      password: 'correct',
    });

    const result = await service.signIn({
      email: 'owner@example.com',
      password: 'correct',
    });

    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem(STORAGE_KEYS.authSession)).not.toBeNull();
    expect(service.signOut().ok).toBe(true);
    expect(service.currentSession()).toEqual({ ok: true, value: null });
    expect(localStorage.getItem(STORAGE_KEYS.accounts)).not.toBeNull();
  });

  it('does not create duplicate accounts for equivalent email addresses', async () => {
    await service.register({
      email: 'owner@example.com',
      displayName: 'Alex Owner',
      password: 'correct',
    });

    await expect(
      service.register({
        email: ' OWNER@EXAMPLE.COM ',
        displayName: 'Another Owner',
        password: 'correct',
      }),
    ).resolves.toEqual({ ok: false, code: 'account-exists' });
  });
});
