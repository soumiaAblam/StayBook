import { Routes } from '@angular/router';
import { applicationRootRedirect, ownerSessionGuard, signedOutOnlyGuard } from './core/routing';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: applicationRootRedirect,
  },
  {
    path: 'choose-language',
    loadChildren: () =>
      import('./features/language/language.routes').then(({ languageRoutes }) => languageRoutes),
  },
  {
    path: 'auth',
    canMatch: [signedOutOnlyGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(({ authRoutes }) => authRoutes),
  },
  {
    path: 'owner',
    canMatch: [ownerSessionGuard],
    loadComponent: () =>
      import('./features/owner-shell/owner-shell.component').then(
        ({ OwnerShellComponent }) => OwnerShellComponent,
      ),
    children: [
      {
        path: 'properties',
        loadChildren: async () => {
          const [propertiesModule, editorModule] = await Promise.all([
            import('./features/properties/properties.routes'),
            import('./features/guide-editor/guide-editor.routes'),
          ]);

          return [...propertiesModule.propertiesRoutes, ...editorModule.GUIDE_EDITOR_ROUTES];
        },
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.routes').then(({ accountRoutes }) => accountRoutes),
      },
      { path: '', pathMatch: 'full', redirectTo: 'properties' },
    ],
  },
  {
    path: 'guide',
    loadChildren: () =>
      import('./features/guest-guide/guest-guide.routes').then(
        ({ GUEST_GUIDE_ROUTES }) => GUEST_GUIDE_ROUTES,
      ),
  },
  { path: '**', redirectTo: '' },
];
