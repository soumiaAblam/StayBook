import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.page').then(({ SignInPage }) => SignInPage),
    title: 'StayBook | Sign in',
  },
  {
    path: 'create-account',
    loadComponent: () =>
      import('./create-account/create-account.page').then(
        ({ CreateAccountPage }) => CreateAccountPage,
      ),
    title: 'StayBook | Create account',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
];
