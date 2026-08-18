import { TestBed } from '@angular/core/testing';
import { translationCatalogs, TranslationKey } from './catalogs';
import { I18nService } from './i18n.service';
import { localeStorageKey, supportedLocales } from './locale';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses English as the safe fallback', () => {
    localStorage.setItem(localeStorageKey, 'unsupported');
    const service = TestBed.inject(I18nService);

    expect(service.locale()).toBe('en-GB');
    expect(service.translate('language.title')).toBe('Choose your language');
  });

  it('persists a supported locale and updates the document language', () => {
    const service = TestBed.inject(I18nService);

    service.setLocale('es-ES');

    expect(service.locale()).toBe('es-ES');
    expect(localStorage.getItem(localeStorageKey)).toBe('es-ES');
    expect(document.documentElement.lang).toBe('es');
  });

  it('interpolates named translation parameters', () => {
    const service = TestBed.inject(I18nService);

    expect(service.translate('guest.welcome', { property: 'Casa Olmo' })).toBe(
      'Welcome to Casa Olmo',
    );
  });

  it('keeps every locale catalog complete', () => {
    const englishKeys = Object.keys(translationCatalogs['en-GB']).sort() as TranslationKey[];

    for (const locale of supportedLocales) {
      expect(Object.keys(translationCatalogs[locale]).sort()).toEqual(englishKeys);
      expect(Object.values(translationCatalogs[locale]).every(Boolean)).toBe(true);
    }
  });
});
