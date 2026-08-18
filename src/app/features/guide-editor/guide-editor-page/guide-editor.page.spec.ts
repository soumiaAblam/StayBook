import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccountWorkspaceRepository, createDefaultProperty } from '../../../core/workspace';
import type { AccountWorkspace } from '../../../core/workspace';
import { GuideEditorPage } from './guide-editor.page';

describe('GuideEditorPage', () => {
  const property = createDefaultProperty({
    id: 'property-1',
    ownerAccountId: 'account-1',
    now: new Date('2026-08-13T12:00:00.000Z'),
  });
  const upsertProperty = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    upsertProperty.mockReset().mockImplementation((updatedProperty) => ({
      ok: true,
      value: {
        schemaVersion: 1,
        profile: {
          accountId: 'account-1',
          displayName: 'Test Owner',
          contactEmail: 'owner@example.test',
          contactPhone: '',
          photoDataUrl: null,
        },
        properties: [updatedProperty],
      } satisfies AccountWorkspace,
    }));
    navigate.mockReset().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [GuideEditorPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ propertyId: property.id, section: 'arrival-access' })),
          },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
        {
          provide: AccountWorkspaceRepository,
          useValue: {
            findProperty: vi.fn().mockReturnValue({ ok: true, value: property }),
            upsertProperty,
          },
        },
      ],
    }).compileComponents();
  });

  it('requires a parking address for every option except no parking', () => {
    const component = TestBed.createComponent(GuideEditorPage).componentInstance;
    const address = component.arrivalForm.controls.parkingAddress;

    component.arrivalForm.controls.parkingKind.setValue('on-site');
    address.setValue('');
    expect(address.hasError('required')).toBe(true);

    component.arrivalForm.controls.parkingKind.setValue('none');
    expect(address.hasError('required')).toBe(false);
  });

  it('requires scheduled breakfast hours and rejects a reversed range', () => {
    const component = TestBed.createComponent(GuideEditorPage).componentInstance;
    component.currentSection.set('extras');
    component.extrasForm.controls.breakfastKind.setValue('scheduled');

    expect(component.extrasForm.controls.breakfastStartHour.hasError('required')).toBe(true);

    component.extrasForm.patchValue({
      breakfastStartHour: '10',
      breakfastStartMinute: '00',
      breakfastEndHour: '09',
      breakfastEndMinute: '00',
    });
    component.saveAndContinue();

    expect(component.extrasForm.controls.breakfastEndHour.hasError('invalidRange')).toBe(true);
    expect(upsertProperty).not.toHaveBeenCalled();
  });

  it('makes transport type conditional and activates the newest recommendation', () => {
    const component = TestBed.createComponent(GuideEditorPage).componentInstance;
    component.currentSection.set('local-guide');

    component.addService();
    component.addService();
    expect(component.activeServiceIndex()).toBe(1);

    const newest = component.services.at(1);
    newest.controls.category.setValue('transport');
    expect(newest.controls.transportType.hasError('required')).toBe(true);

    newest.controls.category.setValue('cafe');
    expect(newest.controls.transportType.hasError('required')).toBe(false);
  });

  it('persists a valid step through the workspace repository', () => {
    const component = TestBed.createComponent(GuideEditorPage).componentInstance;
    component.arrivalForm.patchValue({
      checkInHour: '15',
      checkInMinute: '00',
      writtenAddress: '10 Test Street, Valencia',
      accessInstructions: 'Use the main entrance.',
      parkingKind: 'on-site',
      parkingAddress: '10 Test Street, underground level one',
    });

    component.saveAndContinue();

    expect(upsertProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        arrivalAccess: expect.objectContaining({
          checkInTime: '15:00',
          parking: {
            kind: 'on-site',
            address: '10 Test Street, underground level one',
            instructions: '',
          },
        }),
      }),
    );
    expect(navigate).toHaveBeenCalledWith([
      '/owner/properties',
      property.id,
      'edit',
      'home-essentials',
    ]);
  });

  it('calculates recommendation review metadata only when saving', () => {
    const component = TestBed.createComponent(GuideEditorPage).componentInstance;
    component.currentSection.set('local-guide');
    component.addService();
    component.services.at(0).patchValue({
      title: 'Café Test',
      category: 'cafe',
      distanceFromProperty: '5-minute walk',
      whyUseful: 'A convenient breakfast option.',
    });

    expect(component.services.at(0).controls.lastReviewedAt.value).toBeNull();
    component.saveAndContinue();

    const savedProperty = upsertProperty.mock.calls[0]?.[0];
    expect(savedProperty.localGuide[0].lastReviewedAt).toEqual(expect.any(String));
  });
});
