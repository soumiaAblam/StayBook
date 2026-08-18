import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { translationCatalogs, TranslationKey } from './catalogs';
import { I18nService } from './i18n.service';
import { localeStorageKey, supportedLocales } from './locale';
import { createTranslateServiceStub } from '../../testing/translate-service.stub';

const intentionalSharedCopy: Readonly<
  Record<'es-ES' | 'fr-FR' | 'de-DE', ReadonlySet<TranslationKey>>
> = {
  'es-ES': new Set<TranslationKey>([
    'app.name',
    'editor.transport.taxi',
    'editor.internet',
    'guest.internet',
  ]),
  'fr-FR': new Set<TranslationKey>([
    'app.name',
    'editor.minute',
    'editor.category.cafe',
    'editor.category.restaurant',
    'editor.transport.taxi',
    'editor.instructions',
    'editor.internet',
    'guest.internet',
    'common.menu',
  ]),
  'de-DE': new Set<TranslationKey>([
    'app.name',
    'editor.minute',
    'editor.category.cafe',
    'editor.category.restaurant',
    'editor.transport.taxi',
    'editor.internet',
    'guest.internet',
  ]),
};

function interpolationTokens(value: string): string[] {
  return value.match(/\{\{[a-zA-Z0-9]+\}\}/g)?.sort() ?? [];
}

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: createTranslateServiceStub() }],
    });
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

  it('provides translated copy instead of silently inheriting English', () => {
    const englishCatalog = translationCatalogs['en-GB'];

    for (const locale of ['es-ES', 'fr-FR', 'de-DE'] as const) {
      const unchangedKeys = (Object.keys(englishCatalog) as TranslationKey[])
        .filter((key) => translationCatalogs[locale][key] === englishCatalog[key])
        .sort();

      expect(unchangedKeys).toEqual([...intentionalSharedCopy[locale]].sort());
    }
  });

  it('preserves every named interpolation token in translated copy', () => {
    const englishCatalog = translationCatalogs['en-GB'];

    for (const locale of ['es-ES', 'fr-FR', 'de-DE'] as const) {
      for (const key of Object.keys(englishCatalog) as TranslationKey[]) {
        expect(interpolationTokens(translationCatalogs[locale][key])).toEqual(
          interpolationTokens(englishCatalog[key]),
        );
      }
    }
  });
});
