import { Routes } from '@angular/router';

export const languageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./language-selection.page').then(
        ({ LanguageSelectionPage }) => LanguageSelectionPage,
      ),
    title: 'StayBook',
  },
];
