import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { translationCatalogs } from './catalogs';
import { type SupportedLocale } from './locale';

export class StaticTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, string>> {
    return of(translationCatalogs[lang as SupportedLocale] ?? translationCatalogs['en-GB']);
  }
}
