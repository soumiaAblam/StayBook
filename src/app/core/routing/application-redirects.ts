import { inject } from '@angular/core';
import { CanMatchFn, RedirectFunction, Router } from '@angular/router';
import { AuthSessionRepository } from '../auth';
import { localeStorageKey } from '../i18n/locale';
import { LOCAL_STORAGE } from '../storage';

export const applicationRootRedirect: RedirectFunction = () => {
  const router = inject(Router);
  const sessionResult = inject(AuthSessionRepository).read();

  if (sessionResult.ok && sessionResult.value) {
    return router.parseUrl('/owner/properties');
  }

  const localStorage = inject(LOCAL_STORAGE);
  let hasSelectedLocale: boolean;

  try {
    hasSelectedLocale = localStorage?.getItem(localeStorageKey) !== null;
  } catch {
    hasSelectedLocale = false;
  }

  return router.parseUrl(hasSelectedLocale ? '/auth/sign-in' : '/choose-language');
};

export const ownerSessionGuard: CanMatchFn = () => {
  const sessionResult = inject(AuthSessionRepository).read();

  return sessionResult.ok && sessionResult.value
    ? true
    : inject(Router).createUrlTree(['/auth/sign-in']);
};

export const signedOutOnlyGuard: CanMatchFn = () => {
  const sessionResult = inject(AuthSessionRepository).read();

  return sessionResult.ok && sessionResult.value
    ? inject(Router).createUrlTree(['/owner/properties'])
    : true;
};
