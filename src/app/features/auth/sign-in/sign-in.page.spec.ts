import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LocalAuthService } from '../../../core/auth';
import { SignInPage } from './sign-in.page';
import { WorkspaceSessionCoordinator } from '../../../core/workspace';

describe('SignInPage', () => {
  const signIn = vi.fn();
  const prepare = vi.fn();

  beforeEach(async () => {
    localStorage.clear();
    signIn.mockReset();
    prepare.mockReset().mockReturnValue({ ok: true, value: undefined });

    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([]),
        {
          provide: LocalAuthService,
          useValue: { signIn },
        },
        {
          provide: WorkspaceSessionCoordinator,
          useValue: { prepare },
        },
      ],
    }).compileComponents();
  });

  it('renders only the approved local sign-in controls', () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const email = element.querySelector<HTMLInputElement>('#sign-in-email');
    const password = element.querySelector<HTMLInputElement>('#sign-in-password');

    expect(element.textContent).toContain('Sign in to StayBook');
    expect(element.textContent).not.toContain('Remember');
    expect(element.textContent).not.toContain('Forgot password');
    expect(email?.autocomplete).toBe('email');
    expect(password?.autocomplete).toBe('current-password');
  });

  it('exposes accessible validation without calling the auth service', async () => {
    const fixture = TestBed.createComponent(SignInPage);

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(signIn).not.toHaveBeenCalled();
    expect(element.querySelector('#sign-in-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelectorAll('.field-error')).toHaveLength(2);
  });

  it('starts the session and navigates to the owner properties on success', async () => {
    const fixture = TestBed.createComponent(SignInPage);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    signIn.mockResolvedValue({
      ok: true,
      account: {
        id: 'account-1',
        displayName: 'StayBook Owner',
        email: 'owner@example.com',
      },
      session: {
        accountId: 'account-1',
        authenticatedAt: '2026-08-13T12:00:00.000Z',
      },
    });
    fixture.componentInstance.form.setValue({
      email: 'owner@example.com',
      password: 'secure-password',
    });

    await fixture.componentInstance.submit();

    expect(signIn).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'secure-password',
    });
    expect(navigate).toHaveBeenCalledWith(['/owner/properties']);
    expect(prepare).toHaveBeenCalledWith(expect.objectContaining({ id: 'account-1' }));
  });

  it('shows the same generic message for invalid credentials', async () => {
    const fixture = TestBed.createComponent(SignInPage);
    signIn.mockResolvedValue({
      ok: false,
      code: 'invalid-credentials',
      message: 'Unable to sign in with the provided credentials.',
    });
    fixture.componentInstance.form.setValue({
      email: 'unknown@example.com',
      password: 'wrong-password',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The email address or password is incorrect.',
    );
  });
});
