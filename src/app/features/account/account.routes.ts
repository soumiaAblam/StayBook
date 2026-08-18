import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./account-settings.page').then(({ AccountSettingsPage }) => AccountSettingsPage),
    title: 'StayBook | Account',
  },
];
