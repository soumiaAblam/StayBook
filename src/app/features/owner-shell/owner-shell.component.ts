import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalAuthService } from '../../core/auth';
import { I18nService } from '../../core/i18n/i18n.service';
import { localeOptions, SupportedLocale } from '../../core/i18n/locale';
import { UiIconComponent } from '../../shared/ui';

@Component({
  selector: 'app-owner-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, UiIconComponent],
  templateUrl: './owner-shell.component.html',
  styleUrl: './owner-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerShellComponent {
  private readonly auth = inject(LocalAuthService);
  private readonly router = inject(Router);

  readonly i18n = inject(I18nService);
  readonly localeOptions = localeOptions;

  changeLocale(event: Event): void {
    const locale = (event.target as HTMLSelectElement).value as SupportedLocale;
    this.i18n.setLocale(locale);
  }

  signOut(): void {
    const result = this.auth.signOut();
    if (result.ok) {
      void this.router.navigate(['/auth/sign-in']);
    }
  }
}
