import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthSessionRepository } from '../auth';
import { localeStorageKey } from '../i18n/locale';
import {
  applicationRootRedirect,
  ownerSessionGuard,
  signedOutOnlyGuard,
} from './application-redirects';

describe('application routing decisions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts with language selection when no locale or session exists', () => {
    const target = TestBed.runInInjectionContext(() => applicationRootRedirect({} as never));

    expect(target.toString()).toBe('/choose-language');
  });

  it('still starts with language selection after a locale has been selected', () => {
    localStorage.setItem(localeStorageKey, 'en-GB');
    const target = TestBed.runInInjectionContext(() => applicationRootRedirect({} as never));

    expect(target.toString()).toBe('/choose-language');
  });

  it('starts with the property dashboard for an active session', () => {
    TestBed.inject(AuthSessionRepository).start('account-1');

    const target = TestBed.runInInjectionContext(() => applicationRootRedirect({} as never));

    expect(target.toString()).toBe('/owner/properties');
  });

  it('protects Owner routes and keeps auth routes signed-out only', () => {
    const router = TestBed.inject(Router);
    const ownerTarget = TestBed.runInInjectionContext(() =>
      ownerSessionGuard({} as never, [], {} as never),
    );

    expect(ownerTarget).toEqual(router.createUrlTree(['/auth/sign-in']));

    TestBed.inject(AuthSessionRepository).start('account-1');
    const ownerAllowed = TestBed.runInInjectionContext(() =>
      ownerSessionGuard({} as never, [], {} as never),
    );
    const authTarget = TestBed.runInInjectionContext(() =>
      signedOutOnlyGuard({} as never, [], {} as never),
    );

    expect(ownerAllowed).toBe(true);
    expect(authTarget).toEqual(router.createUrlTree(['/owner/properties']));
  });
});
