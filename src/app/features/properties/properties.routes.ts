import { Routes } from '@angular/router';

export const propertiesRoutes: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./new-property/new-property.page').then(({ NewPropertyPage }) => NewPropertyPage),
    title: 'StayBook | Add property',
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./properties-dashboard/properties-dashboard.page').then(
        ({ PropertiesDashboardPage }) => PropertiesDashboardPage,
      ),
    title: 'StayBook | Properties',
  },
];
