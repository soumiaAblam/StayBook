import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LocalAuthService } from '../../../core/auth';
import { createTranslateServiceStub } from '../../../testing/translate-service.stub';
import { CreateAccountPage } from './create-account.page';

describe('CreateAccountPage', () => {
  const register = vi.fn();

  beforeEach(async () => {
    localStorage.clear();
    register.mockReset();

    await TestBed.configureTestingModule({
      imports: [CreateAccountPage],
      providers: [
        provideRouter([]),
        {
          provide: LocalAuthService,
          useValue: { register },
        },
        { provide: TranslateService, useValue: createTranslateServiceStub() },
      ],
    }).compileComponents();
  });

  it('blocks submission when the confirmation does not match', async () => {
    const fixture = TestBed.createComponent(CreateAccountPage);
    fixture.componentInstance.form.setValue({
      displayName: 'StayBook Owner',
      email: 'owner@example.com',
      password: 'secure-password',
      confirmPassword: 'different-password',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(register).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The passwords do not match.',
    );
  });

  it('registers then returns to sign in without auto-login', async () => {
    const fixture = TestBed.createComponent(CreateAccountPage);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    register.mockResolvedValue({
      ok: true,
      account: {
        id: 'account-1',
        displayName: 'StayBook Owner',
        email: 'owner@example.com',
      },
    });
    fixture.componentInstance.form.setValue({
      displayName: 'StayBook Owner',
      email: 'owner@example.com',
      password: 'secure-password',
      confirmPassword: 'secure-password',
    });

    await fixture.componentInstance.submit();

    expect(register).toHaveBeenCalledWith({
      displayName: 'StayBook Owner',
      email: 'owner@example.com',
      password: 'secure-password',
    });
    expect(navigate).toHaveBeenCalledWith(['/auth/sign-in']);
  });

  it('keeps an existing-email failure actionable and localized', async () => {
    const fixture = TestBed.createComponent(CreateAccountPage);
    register.mockResolvedValue({ ok: false, code: 'account-exists' });
    fixture.componentInstance.form.setValue({
      displayName: 'StayBook Owner',
      email: 'owner@example.com',
      password: 'secure-password',
      confirmPassword: 'secure-password',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'An account already exists for this email address.',
    );
  });
});
