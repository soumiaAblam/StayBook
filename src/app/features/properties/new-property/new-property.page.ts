import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionRepository, WEB_CRYPTO } from '../../../core/auth';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AccountWorkspaceRepository, createDefaultProperty } from '../../../core/workspace';
import { UiIconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-new-property-page',
  imports: [RouterLink, UiIconComponent],
  templateUrl: './new-property.page.html',
  styleUrl: './new-property.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPropertyPage implements OnInit {
  private readonly authSessionRepository = inject(AuthSessionRepository);
  private readonly cryptoProvider = inject(WEB_CRYPTO);
  private readonly router = inject(Router);
  private readonly workspaceRepository = inject(AccountWorkspaceRepository);

  readonly i18n = inject(I18nService);
  readonly failed = signal(false);

  ngOnInit(): void {
    const sessionResult = this.authSessionRepository.read();

    if (!sessionResult.ok || sessionResult.value === null) {
      void this.router.navigate(['/auth/sign-in'], { replaceUrl: true });
      return;
    }

    const propertyId = this.createUuid();
    if (propertyId === null) {
      this.failed.set(true);
      return;
    }

    const property = createDefaultProperty({
      id: propertyId,
      ownerAccountId: sessionResult.value.accountId,
    });
    const saveResult = this.workspaceRepository.upsertProperty(property);

    if (!saveResult.ok) {
      this.failed.set(true);
      return;
    }

    void this.router.navigate(['/owner/properties', property.id, 'edit', 'overview'], {
      replaceUrl: true,
    });
  }

  private createUuid(): string | null {
    if (!this.cryptoProvider) {
      return null;
    }

    if (typeof this.cryptoProvider.randomUUID === 'function') {
      return this.cryptoProvider.randomUUID();
    }

    const bytes = this.cryptoProvider.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20,
    )}-${hex.slice(20)}`;
  }
}
