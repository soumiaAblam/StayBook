import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import type { GuestGuideDetailDto, GuestGuideDetailKind } from '../../domain/guest-guide';
import { createTime24 } from '../../domain/property';
import { GuestChecklistStore } from './guest-checklist.store';
import { GuestGuideDetailPage } from './guest-guide-detail.page';
import { GuestGuideFacade } from './guest-guide.facade';

function configureDetail(
  kind: GuestGuideDetailKind,
  details: Readonly<Partial<Record<GuestGuideDetailKind, GuestGuideDetailDto | null>>>,
  checklistStore = {
    read: vi.fn().mockReturnValue(new Set<string>()),
    write: vi.fn(),
  },
) {
  return TestBed.configureTestingModule({
    imports: [GuestGuideDetailPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { kind },
            parent: { paramMap: { get: () => 'property-one' } },
          },
        },
      },
      {
        provide: GuestGuideFacade,
        useValue: {
          detail: (requestedKind: GuestGuideDetailKind) => details[requestedKind] ?? null,
        },
      },
      { provide: GuestChecklistStore, useValue: checklistStore },
    ],
  }).compileComponents();
}

describe('GuestGuideDetailPage', () => {
  it('keeps access codes out of the DOM until Reveal is activated', async () => {
    await configureDetail('check-in', {
      'home-access': {
        kind: 'home-access',
        method: 'lockbox',
        instructions: 'Use the lockbox.',
        doorCode: 'door-2468',
        lockboxCode: 'box-1357',
      },
    });
    const fixture = TestBed.createComponent(GuestGuideDetailPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).not.toContain('door-2468');
    expect(element.textContent).not.toContain('box-1357');
    element.querySelector<HTMLButtonElement>('.guest-secret button')?.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('door-2468');
    expect(element.textContent).toContain('box-1357');
  });

  it('shows the unavailable state for an absent detail DTO', async () => {
    await configureDetail('parking', {});
    const fixture = TestBed.createComponent(GuestGuideDetailPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'This information is not available yet',
    );
  });

  it('stores the personal checklist without any submit action', async () => {
    const checklistStore = {
      read: vi.fn().mockReturnValue(new Set<string>()),
      write: vi.fn(),
    };
    await configureDetail(
      'checkout',
      {
        checkout: {
          kind: 'checkout',
          checkoutTime: createTime24('11:00'),
          checklist: [{ id: 'keys', label: 'Return the keys' }],
        },
      },
      checklistStore,
    );
    const fixture = TestBed.createComponent(GuestGuideDetailPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('nothing is sent to your host');
    expect(element.querySelector('form')).toBeNull();
    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();

    expect(checklistStore.write).toHaveBeenCalledWith('property-one', new Set(['keys']));
  });
});
