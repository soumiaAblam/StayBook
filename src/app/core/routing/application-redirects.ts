import { inject } from '@angular/core';
import { CanMatchFn, RedirectFunction, Router } from '@angular/router';
import { AuthSessionRepository } from '../auth';

export const applicationRootRedirect: RedirectFunction = () => {
  const router = inject(Router);
  const sessionResult = inject(AuthSessionRepository).read();

  if (sessionResult.ok && sessionResult.value) {
    return router.parseUrl('/owner/properties');
  }

  return router.parseUrl('/choose-language');
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
