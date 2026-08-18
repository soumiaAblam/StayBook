import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AccountWorkspaceRepository } from '../../../core/workspace';
import {
  calculatePropertyCompletion,
  type Property,
  type PropertySectionId,
} from '../../../domain/property';
import { UiIconComponent } from '../../../shared/ui';

const SECTION_ROUTE: Readonly<Record<PropertySectionId, string>> = {
  overview: 'overview',
  'arrival-access': 'arrival-access',
  'home-essentials': 'home-essentials',
  'house-rules': 'house-rules',
  'local-guide': 'local-guide',
  extras: 'extras',
  checkout: 'checkout',
};

@Component({
  selector: 'app-guide-review-page',
  imports: [RouterLink, UiIconComponent],
  templateUrl: './guide-review.page.html',
  styleUrl: './guide-review.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideReviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceRepository = inject(AccountWorkspaceRepository);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly property = signal<Property | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly completion = computed(() => {
    const property = this.property();
    return property === null ? null : calculatePropertyCompletion(property);
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parameters) => {
      this.loadProperty(parameters.get('propertyId') ?? '');
    });
  }

  sectionTitle(section: PropertySectionId): string {
    switch (section) {
      case 'overview':
        return this.i18n.translate('editor.basics');
      case 'arrival-access':
        return this.i18n.translate('editor.arrival');
      case 'home-essentials':
        return this.i18n.translate('editor.home');
      case 'house-rules':
        return this.i18n.translate('editor.rules');
      case 'local-guide':
        return this.i18n.translate('editor.localGuide');
      case 'extras':
        return this.i18n.translate('editor.extras');
      case 'checkout':
        return this.i18n.translate('editor.checkout');
    }
  }

  sectionRoute(section: PropertySectionId): string {
    return SECTION_ROUTE[section];
  }

  missingFieldLabel(path: string): string {
    const label = path.split('.').at(-1) ?? path;
    return label
      .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('-', ' ')
      .replace(/^./, (character) => character.toUpperCase());
  }

  private loadProperty(propertyId: string): void {
    this.loading.set(true);
    const result = this.workspaceRepository.findProperty(propertyId);

    if (!result.ok) {
      this.property.set(null);
      this.errorMessage.set(this.i18n.translate('error.storage'));
    } else if (result.value === null) {
      this.property.set(null);
      this.errorMessage.set(this.i18n.translate('guest.unavailable.title'));
    } else {
      this.property.set(result.value);
      this.errorMessage.set(null);
    }

    this.loading.set(false);
  }
}
