import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalAuthService } from '../../../core/auth';
import { TranslationKey } from '../../../core/i18n/catalogs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { WorkspaceSessionCoordinator } from '../../../core/workspace';

@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.page.html',
  styleUrl: '../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly auth = inject(LocalAuthService);
  private readonly router = inject(Router);
  private readonly workspaceSession = inject(WorkspaceSessionCoordinator);

  readonly i18n = inject(I18nService);
  readonly isSubmitting = signal(false);
  readonly formErrorKey = signal<TranslationKey | null>(null);
  readonly submitAttempted = signal(false);
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(1_024)]],
  });

  shouldShowError(control: FormControl<string>): boolean {
    return control.invalid && (control.touched || this.submitAttempted());
  }

  async submit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.submitAttempted.set(true);
    this.formErrorKey.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const result = await this.auth.signIn(this.form.getRawValue());

      if (!result.ok) {
        this.formErrorKey.set(
          result.code === 'invalid-credentials' ? 'auth.error.invalidCredentials' : 'error.generic',
        );
        return;
      }

      const workspaceResult = this.workspaceSession.prepare(result.account);
      if (!workspaceResult.ok) {
        this.auth.signOut();
        this.formErrorKey.set('error.storage');
        return;
      }

      await this.router.navigate(['/owner/properties']);
    } catch {
      this.formErrorKey.set('error.generic');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
