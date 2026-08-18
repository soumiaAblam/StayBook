import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocaleOption, localeOptions, SupportedLocale } from '../../core/i18n/locale';

@Component({
  selector: 'app-language-selection-page',
  templateUrl: './language-selection.page.html',
  styleUrl: './language-selection.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectionPage {
  private readonly router = inject(Router);

  readonly i18n = inject(I18nService);
  readonly localeOptions: readonly LocaleOption[] = localeOptions;

  selectLocale(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
  }

  continue(): void {
    void this.router.navigate(['/auth/sign-in']);
  }
}
