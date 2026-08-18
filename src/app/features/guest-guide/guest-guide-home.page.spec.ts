import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { GuestGuideSummaryDto } from '../../domain/guest-guide';
import { GuestGuideFacade } from './guest-guide.facade';
import { GuestGuideHomePage } from './guest-guide-home.page';

const summary: GuestGuideSummaryDto = {
  propertyId: 'property-one',
  propertyName: 'Casa Olmo',
  propertyType: 'apartment',
  cityOrArea: 'Valencia',
  welcomeMessage: 'Welcome.',
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
      ],
    }).compileComponents();
  });

  it('orders the mobile-first home sections and makes cards complete links', () => {
    const fixture = TestBed.createComponent(GuestGuideHomePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const headings = [...element.querySelectorAll('.guest-section > h2')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(headings).toEqual([
      'Before you arrive',
      'Essentials',
      'During your stay',
      'Explore the area',
      'Before you leave',
    ]);
    expect(element.querySelector('a[href="/home-address"]')?.textContent).toContain('Home address');
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
