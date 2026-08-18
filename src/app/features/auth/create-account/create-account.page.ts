import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalAuthService } from '../../../core/auth';
import { TranslationKey } from '../../../core/i18n/catalogs';
import { I18nService } from '../../../core/i18n/i18n.service';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as unknown;
  const confirmPassword = control.get('confirmPassword')?.value as unknown;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-create-account-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-account.page.html',
  styleUrl: '../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly auth = inject(LocalAuthService);
  private readonly router = inject(Router);

  readonly i18n = inject(I18nService);
  readonly isSubmitting = signal(false);
  readonly formErrorKey = signal<TranslationKey | null>(null);
  readonly submitAttempted = signal(false);
  readonly form = this.formBuilder.group(
    {
      displayName: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1_024)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(1_024)]],
    },
    { validators: matchingPasswords },
  );

  shouldShowError(control: FormControl<string>): boolean {
    return control.invalid && (control.touched || this.submitAttempted());
  }

  shouldShowPasswordMismatch(): boolean {
    return (
      this.form.hasError('passwordMismatch') &&
      (this.form.controls.confirmPassword.touched || this.submitAttempted())
    );
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
      const { displayName, email, password } = this.form.getRawValue();
      const result = await this.auth.register({ displayName, email, password });

      if (!result.ok) {
        this.formErrorKey.set(
          result.code === 'account-exists' ? 'auth.error.emailExists' : 'error.generic',
        );
        return;
      }

      await this.router.navigate(['/auth/sign-in']);
    } catch {
      this.formErrorKey.set('error.generic');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
