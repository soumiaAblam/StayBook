import type { Routes } from '@angular/router';

export const GUIDE_EDITOR_ROUTES: Routes = [
  {
    path: ':propertyId/edit/:section',
    title: 'StayBook | Guide editor',
    loadComponent: () =>
      import('./guide-editor-page/guide-editor.page').then((module) => module.GuideEditorPage),
  },
  {
    path: ':propertyId/review',
    title: 'StayBook | Review guest guide',
    loadComponent: () =>
      import('./guide-review/guide-review.page').then((module) => module.GuideReviewPage),
  },
];
