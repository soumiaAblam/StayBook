import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import type { TranslationKey } from '../../core/i18n/catalogs';
import { UiIconComponent, type IconName } from '../../shared/ui';
import { GuestCopyService } from './guest-copy.service';
import { GuestGuideFacade } from './guest-guide.facade';
import { GuestUnavailableComponent } from './guest-unavailable.component';

interface GuestHomeCard {
  readonly label: TranslationKey;
  readonly path: string;
  readonly icon: IconName;
  readonly tone: 'blue' | 'green' | 'pink' | 'purple' | 'yellow';
}

@Component({
  selector: 'app-guest-guide-home-page',
  imports: [GuestUnavailableComponent, RouterLink, UiIconComponent],
  templateUrl: './guest-guide-home.page.html',
  styleUrl: './guest-guide-home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestGuideHomePage {
  protected readonly facade = inject(GuestGuideFacade);
  protected readonly i18n = inject(I18nService);
  protected readonly copy = inject(GuestCopyService);

  protected readonly beforeArrivalCards: readonly GuestHomeCard[] = [
    { label: 'guest.homeAddress', path: 'home-address', icon: 'map-pin', tone: 'purple' },
    { label: 'guest.luggage', path: 'luggage', icon: 'luggage', tone: 'yellow' },
    { label: 'guest.parking', path: 'parking', icon: 'parking', tone: 'blue' },
  ];

  protected readonly essentialCards: readonly GuestHomeCard[] = [
    { label: 'guest.checkIn', path: 'check-in', icon: 'door', tone: 'blue' },
    { label: 'guest.homeAccess', path: 'check-in', icon: 'key', tone: 'green' },
    { label: 'guest.getHelp', path: 'help', icon: 'help-circle', tone: 'pink' },
  ];

  protected readonly duringStayCards: readonly GuestHomeCard[] = [
    { label: 'guest.internet', path: 'internet', icon: 'wifi', tone: 'blue' },
    { label: 'guest.homeCare', path: 'home-care', icon: 'home-care', tone: 'yellow' },
    { label: 'guest.houseRules', path: 'house-rules', icon: 'list', tone: 'green' },
    { label: 'guest.extras', path: 'extras', icon: 'sparkles', tone: 'pink' },
  ];

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat(this.i18n.locale(), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date);
  }
}
