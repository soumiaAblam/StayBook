import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { localeStorageKey } from '../../core/i18n/locale';
import { LanguageSelectionPage } from './language-selection.page';

describe('LanguageSelectionPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageSelectionPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('selects and persists one of the supported languages', () => {
    const fixture = TestBed.createComponent(LanguageSelectionPage);

    fixture.componentInstance.selectLocale('fr-FR');
    fixture.detectChanges();

    expect(localStorage.getItem(localeStorageKey)).toBe('fr-FR');
    expect(fixture.nativeElement.textContent).toContain('Choisissez votre langue');
  });

  it('continues to sign in', () => {
    const fixture = TestBed.createComponent(LanguageSelectionPage);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.continue();

    expect(navigate).toHaveBeenCalledWith(['/auth/sign-in']);
  });
});
