import { TestBed } from '@angular/core/testing';
import { SESSION_STORAGE, STORAGE_KEYS } from '../../core/storage';
import { GuestChecklistStore } from './guest-checklist.store';

describe('GuestChecklistStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: SESSION_STORAGE, useValue: sessionStorage }],
    });
  });

  it('persists only allowed checklist item identifiers per property', () => {
    const store = TestBed.inject(GuestChecklistStore);
    store.write('property-one', new Set(['keys', 'rubbish']));

    expect(store.read('property-one', ['keys'])).toEqual(new Set(['keys']));
    expect(sessionStorage.getItem(STORAGE_KEYS.guestChecklist('property-one'))).not.toContain(
      'property data',
    );
  });

  it('fails safely when stored checklist JSON is corrupt', () => {
    const store = TestBed.inject(GuestChecklistStore);
    sessionStorage.setItem(STORAGE_KEYS.guestChecklist('property-one'), '{broken');

    expect(store.read('property-one', ['keys'])).toEqual(new Set());
  });
});
