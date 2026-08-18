import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiIconComponent } from '../../shared/ui';

@Component({
  selector: 'app-guest-unavailable',
  imports: [RouterLink, UiIconComponent],
  template: `
    <section class="guest-unavailable" role="status">
      <span class="guest-unavailable__icon"><app-icon name="info" /></span>
      <h1>{{ i18n.translate('guest.unavailable.title') }}</h1>
      <p>{{ i18n.translate('guest.unavailable.body') }}</p>
      <a class="button button--primary" routerLink="../">
        <app-icon name="arrow-left" />
        {{ i18n.translate('guest.backToGuide') }}
      </a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestUnavailableComponent {
  protected readonly i18n = inject(I18nService);
}
