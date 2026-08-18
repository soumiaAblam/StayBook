import type { Routes } from '@angular/router';
import { GuestGuideFacade } from './guest-guide.facade';

export const GUEST_GUIDE_ROUTES: Routes = [
  {
    path: ':propertyId',
    providers: [GuestGuideFacade],
    loadComponent: () =>
      import('./guest-guide-shell.component').then((module) => module.GuestGuideShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./guest-guide-home.page').then((module) => module.GuestGuideHomePage),
      },
      ...[
        'check-in',
        'home-address',
        'luggage',
        'parking',
        'internet',
        'home-care',
        'house-rules',
        'help',
        'local-guide',
        'transport',
        'extras',
        'checkout',
      ].map((kind) => ({
        path: kind,
        data: { kind },
        loadComponent: () =>
          import('./guest-guide-detail.page').then((module) => module.GuestGuideDetailPage),
      })),
      {
        path: 'local-guide/:serviceId',
        loadComponent: () =>
          import('./guest-recommendation.page').then((module) => module.GuestRecommendationPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default GUEST_GUIDE_ROUTES;
