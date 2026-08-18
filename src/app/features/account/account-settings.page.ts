import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { AccountWorkspaceRepository } from '../../core/workspace';

@Component({
  selector: 'app-account-settings-page',
  imports: [ReactiveFormsModule],
  templateUrl: './account-settings.page.html',
  styleUrl: './account-settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly workspaces = inject(AccountWorkspaceRepository);
  private accountId = '';

  readonly i18n = inject(I18nService);
  readonly saved = signal(false);
  readonly error = signal(false);
  readonly form = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    contactEmail: ['', [Validators.email, Validators.maxLength(254)]],
    contactPhone: ['', [Validators.maxLength(40)]],
  });

  constructor() {
    const workspaceResult = this.workspaces.read();
    if (!workspaceResult.ok || !workspaceResult.value) {
      this.error.set(true);
      this.form.disable();
      return;
    }

    const profile = workspaceResult.value.profile;
    this.accountId = profile.accountId;
    this.form.setValue({
      displayName: profile.displayName,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
    });
  }

  save(): void {
    this.saved.set(false);
    this.error.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.accountId) {
      return;
    }

    const value = this.form.getRawValue();
    const result = this.workspaces.updateProfile({
      accountId: this.accountId,
      displayName: value.displayName.trim(),
      contactEmail: value.contactEmail.trim(),
      contactPhone: value.contactPhone.trim(),
      photoDataUrl: null,
    });

    if (!result.ok) {
      this.error.set(true);
      return;
    }

    this.saved.set(true);
  }
}
