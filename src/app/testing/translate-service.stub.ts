import type { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { defaultLocale, type SupportedLocale } from '../core/i18n/locale';
import { translationCatalogs, type TranslationKey } from '../core/i18n/catalogs';

export function createTranslateServiceStub(
  initialLocale: SupportedLocale = defaultLocale,
): Pick<
  TranslateService,
  'addLangs' | 'setTranslation' | 'setFallbackLang' | 'use' | 'instant'
> {
  let currentLocale = initialLocale;
  let fallbackLocale = defaultLocale;

  return {
    addLangs: () => undefined,
    setTranslation: () => undefined,
    setFallbackLang: (locale: SupportedLocale) => {
      fallbackLocale = locale;
      return of({});
    },
    use: (locale: SupportedLocale) => {
      currentLocale = locale;
      return of({});
    },
    instant: (key: TranslationKey, parameters?: Record<string, string | number>) => {
      const template =
        translationCatalogs[currentLocale][key] ?? translationCatalogs[fallbackLocale][key] ?? key;

      return Object.entries(parameters ?? {}).reduce(
        (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
        template,
      );
    },
  } as unknown as Pick<
    TranslateService,
    'addLangs' | 'setTranslation' | 'setFallbackLang' | 'use' | 'instant'
  >;
}
