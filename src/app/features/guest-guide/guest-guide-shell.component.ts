import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { localeOptions, type SupportedLocale } from '../../core/i18n/locale';
import { UiIconComponent } from '../../shared/ui';
import { GuestGuideFacade } from './guest-guide.facade';

@Component({
  selector: 'app-guest-guide-shell',
  imports: [RouterLink, RouterOutlet, UiIconComponent],
  templateUrl: './guest-guide-shell.component.html',
  styleUrl: './guest-guide.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class GuestGuideShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(GuestGuideFacade);
  protected readonly i18n = inject(I18nService);
  protected readonly localeOptions = localeOptions;
  protected readonly propertyId: string;
  protected readonly isHome = signal(true);

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    this.propertyId = activatedRoute.snapshot.paramMap.get('propertyId') ?? '';
    this.facade.load(this.propertyId);
    this.updatePageKind();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updatePageKind());
  }

  protected changeLocale(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (localeOptions.some((option) => option.locale === value)) {
      this.i18n.setLocale(value as SupportedLocale);
    }
  }

  private updatePageKind(): void {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/$/, '');
    this.isHome.set(path.endsWith(`/guide/${encodeURIComponent(this.propertyId)}`));
  }
}
