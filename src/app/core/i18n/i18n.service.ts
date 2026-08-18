import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationKey, translationCatalogs } from './catalogs';
import {
  defaultLocale,
  getDocumentLanguage,
  isSupportedLocale,
  localeStorageKey,
  SupportedLocale,
  supportedLocales,
} from './locale';

export type TranslationParameters = Readonly<Record<string, string | number>>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly translateService = inject(TranslateService);
  private readonly selectedLocale = signal<SupportedLocale>(this.readStoredLocale());

  readonly locale = this.selectedLocale.asReadonly();
  readonly language = computed(() => getDocumentLanguage(this.selectedLocale()));

  constructor() {
    this.translateService.addLangs([...supportedLocales]);

    for (const locale of supportedLocales) {
      this.translateService.setTranslation(locale, translationCatalogs[locale], true);
    }

    this.translateService.setFallbackLang(defaultLocale);
    this.translateService.use(this.selectedLocale());
    this.syncDocumentLanguage(this.selectedLocale());
  }

  setLocale(locale: SupportedLocale): void {
    this.selectedLocale.set(locale);
    this.writeStoredLocale(locale);
    this.translateService.use(locale);
    this.syncDocumentLanguage(locale);
  }

  translate(key: TranslationKey, parameters: TranslationParameters = {}): string {
    return this.translateService.instant(key, parameters);
  }

  private readStoredLocale(): SupportedLocale {
    try {
      const value = globalThis.localStorage?.getItem(localeStorageKey);
      return isSupportedLocale(value) ? value : defaultLocale;
    } catch {
      return defaultLocale;
    }
  }

  private writeStoredLocale(locale: SupportedLocale): void {
    try {
      globalThis.localStorage?.setItem(localeStorageKey, locale);
    } catch {
      // A selected locale still applies to the current runtime when storage is unavailable.
    }
  }

  private syncDocumentLanguage(locale: SupportedLocale): void {
    this.document.documentElement.lang = getDocumentLanguage(locale);
  }
}
