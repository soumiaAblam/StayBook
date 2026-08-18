import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { englishCatalog, TranslationKey, translationCatalogs } from './catalogs';
import {
  defaultLocale,
  getDocumentLanguage,
  isSupportedLocale,
  localeStorageKey,
  SupportedLocale,
} from './locale';

export type TranslationParameters = Readonly<Record<string, string | number>>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly selectedLocale = signal<SupportedLocale>(this.readStoredLocale());

  readonly locale = this.selectedLocale.asReadonly();
  readonly language = computed(() => getDocumentLanguage(this.selectedLocale()));

  constructor() {
    this.syncDocumentLanguage(this.selectedLocale());
  }

  setLocale(locale: SupportedLocale): void {
    this.selectedLocale.set(locale);
    this.writeStoredLocale(locale);
    this.syncDocumentLanguage(locale);
  }

  translate(key: TranslationKey, parameters: TranslationParameters = {}): string {
    const template = translationCatalogs[this.selectedLocale()][key] ?? englishCatalog[key];

    return Object.entries(parameters).reduce(
      (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
      template,
    );
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
