import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import type { GuestGuideSummaryDto } from '../../domain/guest-guide';
import { GuestGuideFacade } from './guest-guide.facade';
import { GuestGuideHomePage } from './guest-guide-home.page';

const summary: GuestGuideSummaryDto = {
  propertyId: 'property-one',
  propertyName: 'Casa Olmo',
  propertyType: 'apartment',
  cityOrArea: 'Valencia',
  lastReviewedAt: '2026-08-13T12:00:00.000Z',
  availableDetails: ['check-in', 'home-address', 'local-guide'],
};

describe('GuestGuideHomePage', () => {
  const summarySignal = signal<GuestGuideSummaryDto | null>(summary);

  beforeEach(async () => {
    summarySignal.set(summary);
    await TestBed.configureTestingModule({
      imports: [GuestGuideHomePage],
      providers: [
        provideRouter([
          { path: 'home-address', component: GuestGuideHomePage },
          { path: 'local-guide', component: GuestGuideHomePage },
        ]),
        {
          provide: GuestGuideFacade,
          useValue: { summary: summarySignal.asReadonly() },
        },
        {
          provide: TranslateService,
          useValue: {
            addLangs: vi.fn(),
            setTranslation: vi.fn(),
            setFallbackLang: vi.fn(),
            use: vi.fn(),
            instant: (key: string) =>
              ({
                'guest.beforeArrival': 'Before you arrive',
                'guest.essentialsNow': 'Essentials now',
                'guest.duringStay': 'During your stay',
                'guest.explore': 'Explore the area',
                'guest.beforeLeave': 'Before you leave',
                'guest.homeAddress': 'Home address',
                'guest.homeAccess': 'Home access',
                'guest.localGuide': 'Local guide',
                'guest.unavailable.title': 'This information is not available yet',
                'guest.unavailable.body': 'Your host has not added details for this section.',
                'guest.welcome': 'Welcome to Casa Olmo',
                'guest.lastReviewed': 'Last reviewed: 13 August 2026',
                'guest.startHere': 'Start here',
              }[key] ?? key),
          },
        },
      ],
    }).compileComponents();
  });

  it('orders the mobile-first home sections and makes cards complete links', () => {
    const fixture = TestBed.createComponent(GuestGuideHomePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const headings = [...element.querySelectorAll('.guest-section-heading > h2')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(headings).toEqual([
      'Before you arrive',
      'Essentials now',
      'During your stay',
      'Explore the area',
      'Before you leave',
    ]);
    expect(element.querySelector('a[href="/home-address"]')?.textContent).toContain('Home address');
    expect(element.querySelector('a[href="/home-access"]')?.textContent).toContain('Home access');
    expect(element.querySelector('a[href="/local-guide"]')?.textContent).toContain('Local guide');
  });

  it('navigates when a whole card is activated', async () => {
    const fixture = TestBed.createComponent(GuestGuideHomePage);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLAnchorElement>('a[href="/home-address"]')
      ?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/home-address');
  });

  it('renders a safe unavailable state when no mapped guide exists', () => {
    summarySignal.set(null);
    const fixture = TestBed.createComponent(GuestGuideHomePage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'This information is not available yet',
    );
  });
});
