import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SESSION_STORAGE, SessionWorkspaceRepository, STORAGE_KEYS, isRecord } from '../storage';
import { AuthSessionRepository } from './auth-session.repository';

describe('AuthSessionRepository', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores only the authenticated identity in session storage', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SESSION_STORAGE, useValue: sessionStorage }],
    });
    const repository = TestBed.inject(AuthSessionRepository);
    const result = repository.start('account-1', new Date('2026-08-13T12:00:00.000Z'));

    expect(result).toEqual({
      ok: true,
      value: {
        accountId: 'account-1',
        authenticatedAt: '2026-08-13T12:00:00.000Z',
      },
    });
    expect(repository.read()).toEqual(result);
    expect(localStorage.getItem(STORAGE_KEYS.authSession)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.authSession)).not.toBeNull();
  });

  it('clears the identity on sign-out without deleting the namespaced workspace', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SESSION_STORAGE, useValue: sessionStorage }],
    });
    const repository = TestBed.inject(AuthSessionRepository);
    const workspace = new SessionWorkspaceRepository(
      sessionStorage,
      'account-1',
      (value): value is Record<string, unknown> => isRecord(value),
    );
    repository.start('account-1');
    workspace.save({ propertyCount: 2 });

    expect(repository.clear().ok).toBe(true);
    expect(repository.read()).toEqual({ ok: true, value: null });
    expect(workspace.read()).toEqual({ ok: true, value: { propertyCount: 2 } });
  });
});
