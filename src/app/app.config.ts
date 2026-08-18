import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { StaticTranslateLoader } from './core/i18n/static-translate-loader';
import { FixtureAccountProvisioner } from './core/workspace';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTranslateService({
      loader: provideTranslateLoader(() => new StaticTranslateLoader()),
    }),
    provideAppInitializer(() => inject(FixtureAccountProvisioner).ensureFixtureAccount()),
  ],
};
