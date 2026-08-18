import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import type { GuestNearbyServiceDto } from '../../domain/guest-guide';
import { UiIconComponent } from '../../shared/ui';
import { GuestCopyService } from './guest-copy.service';
import { GuestGuideFacade } from './guest-guide.facade';
import { GuestInfoBlockComponent } from './guest-info-block.component';
import { GuestUnavailableComponent } from './guest-unavailable.component';

@Component({
  selector: 'app-guest-recommendation-page',
  imports: [GuestInfoBlockComponent, GuestUnavailableComponent, UiIconComponent],
  template: `
    <main id="guest-main" class="guest-main guest-detail">
      @if (recommendation(); as service) {
        <header class="guest-detail__heading tone-purple">
          <span class="guest-detail__icon"><app-icon name="map-pin" /></span>
          <p>{{ categoryLabel(service) }}</p>
          <h1>{{ service.title }}</h1>
        </header>
        <div class="guest-detail-stack">
          @if (service.distanceFromProperty) {
            <app-info-block
              [label]="copy.text('distance')"
              [value]="service.distanceFromProperty"
            />
          }
          @if (service.whyUseful) {
            <app-info-block [label]="copy.text('whyUseful')" [value]="service.whyUseful" />
          }
          @if (service.lastReviewedAt) {
            <p class="guest-reviewed">
              <app-icon name="check" />
              {{
                i18n.translate('guest.lastReviewed', {
                  date: formatDate(service.lastReviewedAt),
                })
              }}
            </p>
          }
        </div>
      } @else {
        <app-guest-unavailable />
      }
    </main>
  `,
  styleUrl: './guest-guide-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRecommendationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(GuestGuideFacade);
  protected readonly i18n = inject(I18nService);
  protected readonly copy = inject(GuestCopyService);
  protected readonly recommendation = () =>
    this.facade.recommendation(this.route.snapshot.paramMap.get('serviceId') ?? '');

  protected categoryLabel(service: GuestNearbyServiceDto): string {
    return this.copy.text(`category.${service.category}`);
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat(this.i18n.locale(), { dateStyle: 'medium' }).format(date);
  }
}
