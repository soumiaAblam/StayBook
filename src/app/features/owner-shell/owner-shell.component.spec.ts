import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocalAuthService } from '../../core/auth';
import { OwnerShellComponent } from './owner-shell.component';

describe('OwnerShellComponent', () => {
  const translateService = {
    addLangs: vi.fn(),
    setTranslation: vi.fn(),
    setFallbackLang: vi.fn(),
    use: vi.fn(),
    instant: (key: string) =>
      ({
        'nav.properties': 'Properties',
        'auth.signOut': 'Sign out',
        'language.change': 'Change language',
        'nav.ownerNavigation': 'Owner navigation',
        'nav.staybookProperties': 'StayBook properties',
      }[key] ?? key),
  };

  it('renders the Owner navigation without a notification control', async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerShellComponent],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: translateService },
        { provide: LocalAuthService, useValue: { signOut: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OwnerShellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const signOutButton = element.querySelector('.sign-out-button') as HTMLButtonElement | null;

    expect(element.querySelector('nav')).not.toBeNull();
    expect(element.textContent).toContain('Properties');
    expect(element.textContent).not.toContain('Notifications');
    expect(signOutButton).not.toBeNull();
    expect(signOutButton?.getAttribute('aria-label')).toBe('Sign out');
  });

  it('reflects the active locale in the owner language select', async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerShellComponent],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: translateService },
        { provide: LocalAuthService, useValue: { signOut: vi.fn() } },
      ],
    }).compileComponents();

    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('fr-FR');
    const fixture = TestBed.createComponent(OwnerShellComponent);
    fixture.detectChanges();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select');

    expect(select).not.toBeNull();
    expect((select as HTMLSelectElement).value).toBe('fr-FR');
  });
});
