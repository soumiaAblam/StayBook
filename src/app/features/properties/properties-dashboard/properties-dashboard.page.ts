import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AccountWorkspaceRepository } from '../../../core/workspace';
import {
  calculatePropertyCompletion,
  type Property,
  type PropertyCompletion,
} from '../../../domain/property';
import { UiIconComponent } from '../../../shared/ui';

type PropertyStatus = 'attention' | 'progress' | 'ready';

interface PropertyCardView {
  readonly completion: PropertyCompletion;
  readonly property: Property;
  readonly status: PropertyStatus;
}

@Component({
  selector: 'app-properties-dashboard-page',
  imports: [RouterLink, UiIconComponent],
  templateUrl: './properties-dashboard.page.html',
  styleUrl: './properties-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesDashboardPage implements OnInit {
  private readonly workspaceRepository = inject(AccountWorkspaceRepository);
  private readonly properties = signal<readonly Property[]>([]);

  readonly i18n = inject(I18nService);
  readonly loadFailed = signal(false);
  readonly cards = computed<readonly PropertyCardView[]>(() =>
    this.properties().map((property) => {
      const completion = calculatePropertyCompletion(property);

      return {
        property,
        completion,
        status: this.resolveStatus(completion),
      };
    }),
  );

  ngOnInit(): void {
    const result = this.workspaceRepository.listProperties();

    if (!result.ok) {
      this.loadFailed.set(true);
      return;
    }

    this.properties.set(result.value);
  }

  protected statusLabel(status: PropertyStatus): string {
    switch (status) {
      case 'ready':
        return this.i18n.translate('properties.ready');
      case 'progress':
        return this.i18n.translate('properties.inProgress');
      case 'attention':
        return this.i18n.translate('properties.needsAttention');
    }
  }

  protected propertyName(property: Property): string {
    return property.overview.name.trim() || this.i18n.translate('common.notAvailable');
  }

  private resolveStatus(completion: PropertyCompletion): PropertyStatus {
    if (completion.complete) {
      return 'ready';
    }

    return completion.percentage >= 50 ? 'progress' : 'attention';
  }
}
