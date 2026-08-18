import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import type { TranslationKey } from '../../core/i18n/catalogs';
import type {
  GuestGuideDetailDto,
  GuestGuideDetailKind,
  GuestNearbyServiceDto,
} from '../../domain/guest-guide';
import type { RulePolicy } from '../../domain/property';
import { MapLocationParser, type ParsedMapLocation } from '../../shared/map';
import { UiIconComponent, type IconName } from '../../shared/ui';
import { GuestChecklistStore } from './guest-checklist.store';
import { GuestCopyService, type GuestCopyKey } from './guest-copy.service';
import { GuestGuideFacade } from './guest-guide.facade';
import { GuestUnavailableComponent } from './guest-unavailable.component';
import { GuestInfoBlockComponent } from './guest-info-block.component';
import { GuestExtraCardComponent } from './guest-extra-card.component';

interface DetailPresentation {
  readonly titleKey: Parameters<I18nService['translate']>[0];
  readonly icon: IconName;
  readonly tone: 'blue' | 'green' | 'pink' | 'purple' | 'yellow';
}

const PRESENTATIONS: Readonly<Record<GuestGuideDetailKind, DetailPresentation>> = {
  'check-in': { titleKey: 'guest.checkIn', icon: 'door', tone: 'blue' },
  'home-access': { titleKey: 'guest.homeAccess', icon: 'key', tone: 'green' },
  'home-address': { titleKey: 'guest.homeAddress', icon: 'map-pin', tone: 'purple' },
  luggage: { titleKey: 'guest.luggage', icon: 'luggage', tone: 'yellow' },
  parking: { titleKey: 'guest.parking', icon: 'parking', tone: 'blue' },
  internet: { titleKey: 'guest.internet', icon: 'wifi', tone: 'blue' },
  'home-care': { titleKey: 'guest.homeCare', icon: 'home-care', tone: 'yellow' },
  'house-rules': { titleKey: 'guest.houseRules', icon: 'list', tone: 'green' },
  help: { titleKey: 'guest.getHelp', icon: 'help-circle', tone: 'pink' },
  'local-guide': { titleKey: 'guest.localGuide', icon: 'map-pin', tone: 'purple' },
  transport: { titleKey: 'guest.transport', icon: 'bus', tone: 'blue' },
  extras: { titleKey: 'guest.extras', icon: 'sparkles', tone: 'pink' },
  checkout: { titleKey: 'guest.checkout', icon: 'checkout', tone: 'green' },
};

@Component({
  selector: 'app-guest-guide-detail-page',
  imports: [
    GuestExtraCardComponent,
    GuestInfoBlockComponent,
    GuestUnavailableComponent,
    RouterLink,
    UiIconComponent,
  ],
  templateUrl: './guest-guide-detail.page.html',
  styleUrl: './guest-guide-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestGuideDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(GuestGuideFacade);
  private readonly mapParser = inject(MapLocationParser);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly checklistStore = inject(GuestChecklistStore);
  protected readonly i18n = inject(I18nService);
  protected readonly copy = inject(GuestCopyService);
  protected readonly propertyId = this.route.snapshot.parent?.paramMap.get('propertyId') ?? '';
  protected readonly kind = this.route.snapshot.data['kind'] as GuestGuideDetailKind;
  protected readonly presentation = PRESENTATIONS[this.kind];
  protected readonly accessRevealed = signal(false);
  protected readonly locationPreviewOpen = signal(false);
  protected readonly checkedItems = signal<ReadonlySet<string>>(new Set());
  protected readonly mapLocation = computed<ParsedMapLocation | null>(() => {
    const detail = this.detail();
    if (detail?.kind !== 'home-address' || !detail.mapReference) {
      return null;
    }
    const result = this.mapParser.parse(detail.mapReference);
    return result.ok ? result : null;
  });
  protected readonly safeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const embedUrl = this.mapLocation()?.embedUrl;
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  });

  protected readonly detail = computed<GuestGuideDetailDto | null>(() => {
    if (this.kind === 'local-guide') {
      const localGuide = this.facade.detail('local-guide');
      return (
        localGuide ??
        (this.facade.detail('transport')?.kind === 'transport'
          ? { kind: 'local-guide', services: [] }
          : null)
      );
    }

    return this.facade.detail(this.kind);
  });

  constructor() {
    const checkout = this.detail();
    if (checkout?.kind === 'checkout') {
      this.checkedItems.set(
        this.checklistStore.read(
          this.propertyId,
          checkout.checklist.map((item) => item.id),
        ),
      );
    }
  }

  protected toggleAccess(): void {
    this.accessRevealed.update((value) => !value);
  }

  protected toggleLocationPreview(): void {
    this.locationPreviewOpen.update((value) => !value);
  }

  protected toggleChecklistItem(itemId: string): void {
    const next = new Set(this.checkedItems());
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    this.checkedItems.set(next);
    this.checklistStore.write(this.propertyId, next);
  }

  protected isChecked(itemId: string): boolean {
    return this.checkedItems().has(itemId);
  }

  protected policyLabel(policy: RulePolicy): string {
    const key: GuestCopyKey =
      policy === 'allowed' ? 'allowed' : policy === 'ask-host' ? 'askHost' : 'notAllowed';
    return this.copy.text(key);
  }

  protected categoryLabel(service: GuestNearbyServiceDto): string {
    return this.copy.text(`category.${service.category}`);
  }

  protected transportLabel(type: 'public-transport' | 'taxi'): string {
    return this.copy.text(type === 'taxi' ? 'transport.taxi' : 'transport.public');
  }

  protected breakfastLabel(kind: 'on-request' | 'scheduled' | 'unavailable'): string {
    const key: GuestCopyKey =
      kind === 'on-request'
        ? 'breakfast.onRequest'
        : kind === 'scheduled'
          ? 'breakfast.scheduled'
          : 'breakfast.unavailable';
    return this.copy.text(key);
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat(this.i18n.locale(), { dateStyle: 'medium' }).format(date);
  }

  protected sectionTitleKey(): TranslationKey {
    switch (this.kind) {
      case 'check-in':
      case 'home-access':
      case 'home-address':
      case 'luggage':
      case 'parking':
        return 'guest.beforeArrival';
      case 'internet':
      case 'home-care':
      case 'house-rules':
      case 'extras':
      case 'checkout':
        return 'guest.duringStay';
      case 'local-guide':
      case 'transport':
        return 'guest.explore';
      case 'help':
        return 'guest.getHelp';
    }
  }
}
