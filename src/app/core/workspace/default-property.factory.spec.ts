import { calculatePropertyCompletion } from '../../domain/property';
import { describe, expect, it } from 'vitest';
import { createDefaultProperty, DEFAULT_CHECKOUT_ITEMS } from './default-property.factory';

describe('createDefaultProperty', () => {
  it('creates a safe empty draft with four default checkout items', () => {
    const property = createDefaultProperty({
      id: 'property-1',
      ownerAccountId: 'account-1',
      now: new Date('2026-08-13T12:00:00.000Z'),
    });

    expect(property).toMatchObject({
      schemaVersion: 1,
      id: 'property-1',
      ownerAccountId: 'account-1',
      homeEssentials: { wifi: null },
      metadata: {
        createdAt: '2026-08-13T12:00:00.000Z',
        updatedAt: '2026-08-13T12:00:00.000Z',
      },
    });
    expect(property.arrivalAccess.homeAccess.doorCode).toBe('');
    expect(property.arrivalAccess.homeAccess.lockboxCode).toBe('');
    expect(property.checkout.checklist).toHaveLength(4);
    expect(property.checkout.checklist.every((item) => item.isDefault)).toBe(true);
    expect(new Set(property.checkout.checklist.map((item) => item.id)).size).toBe(4);
    expect(calculatePropertyCompletion(property).complete).toBe(false);
  });

  it('returns fresh checkout item objects for every property', () => {
    const first = createDefaultProperty({ id: 'property-1', ownerAccountId: 'account-1' });
    const second = createDefaultProperty({ id: 'property-2', ownerAccountId: 'account-1' });

    expect(first.checkout.checklist).not.toBe(second.checkout.checklist);
    expect(first.checkout.checklist[0]).not.toBe(second.checkout.checklist[0]);
    expect(DEFAULT_CHECKOUT_ITEMS).toHaveLength(4);
  });
});
