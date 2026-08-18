import { computed, inject, Injectable, signal } from '@angular/core';
import { AccountWorkspaceRepository } from '../../core/workspace';
import {
  GuestGuideMapper,
  type GuestGuideDetailDto,
  type GuestGuideDetailKind,
  type GuestGuideSummaryDto,
  type GuestNearbyServiceDto,
} from '../../domain/guest-guide';
import type { PropertyId } from '../../domain/property';

export type GuestGuideLoadStatus = 'idle' | 'ready' | 'unavailable';

type GuestDetails = Readonly<Partial<Record<GuestGuideDetailKind, GuestGuideDetailDto | null>>>;

interface GuestGuideProjection {
  readonly summary: GuestGuideSummaryDto;
  readonly details: GuestDetails;
}

const DETAIL_KINDS: readonly GuestGuideDetailKind[] = [
  'check-in',
  'home-access',
  'home-address',
  'luggage',
  'parking',
  'internet',
  'home-care',
  'house-rules',
  'help',
  'local-guide',
  'transport',
  'extras',
  'checkout',
];

/**
 * The only bridge between the editable Owner workspace and Guest templates.
 * Editable Property objects remain private and are discarded after mapping.
 */
@Injectable()
export class GuestGuideFacade {
  private readonly workspaceRepository = inject(AccountWorkspaceRepository);
  private readonly mapper = new GuestGuideMapper();
  private readonly projection = signal<GuestGuideProjection | null>(null);
  private readonly loadStatus = signal<GuestGuideLoadStatus>('idle');

  readonly status = this.loadStatus.asReadonly();
  readonly summary = computed(() => this.projection()?.summary ?? null);

  load(propertyId: string): void {
    const result = this.workspaceRepository.findProperty(propertyId as PropertyId);

    if (!result.ok || result.value === null) {
      this.projection.set(null);
      this.loadStatus.set('unavailable');
      return;
    }

    const property = result.value;
    const details = Object.fromEntries(
      DETAIL_KINDS.map((kind) => [kind, this.mapper.toDetail(property, kind)]),
    ) as GuestDetails;

    this.projection.set({
      summary: this.mapper.toSummary(property),
      details,
    });
    this.loadStatus.set('ready');
  }

  detail<Kind extends GuestGuideDetailKind>(kind: Kind): GuestGuideDetailDto | null {
    return this.projection()?.details[kind] ?? null;
  }

  recommendation(serviceId: string): GuestNearbyServiceDto | null {
    const detail = this.detail('local-guide');

    return detail?.kind === 'local-guide'
      ? (detail.services.find((service) => service.id === serviceId) ?? null)
      : null;
  }
}
