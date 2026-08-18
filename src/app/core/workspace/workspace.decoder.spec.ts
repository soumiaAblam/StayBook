import type { Property } from '../../domain/property';
import { describe, expect, it } from 'vitest';
import { createEmptyAccountWorkspace } from './account-workspace.model';
import { createDefaultProperty } from './default-property.factory';
import { createFixtureWorkspace } from './fixture-workspace.factory';
import { isAccountWorkspace, isProperty, WORKSPACE_LIMITS } from './workspace.decoder';

const profile = {
  accountId: 'account-1',
  displayName: 'Demo Owner',
  contactEmail: 'owner@example.test',
  contactPhone: '',
  photoDataUrl: null,
} as const;

describe('workspace runtime decoders', () => {
  it('accepts valid empty, default and fixture data', () => {
    const property = createDefaultProperty({ id: 'property-1', ownerAccountId: profile.accountId });

    expect(isProperty(property)).toBe(true);
    expect(isAccountWorkspace(createEmptyAccountWorkspace(profile))).toBe(true);
    expect(isAccountWorkspace(createFixtureWorkspace())).toBe(true);
  });

  it('rejects unknown fields at every decoded boundary', () => {
    const property = createDefaultProperty({ id: 'property-1', ownerAccountId: profile.accountId });
    const unsafeProperty = {
      ...property,
      overview: { ...property.overview, injected: '<script>alert(1)</script>' },
    };

    expect(isProperty(unsafeProperty)).toBe(false);
    expect(
      isAccountWorkspace({
        ...createEmptyAccountWorkspace(profile),
        unexpected: true,
      }),
    ).toBe(false);
  });

  it('rejects excessive text, unsafe image data and invalid times', () => {
    const property = createDefaultProperty({ id: 'property-1', ownerAccountId: profile.accountId });
    const oversized = {
      ...property,
      internalNotes: 'x'.repeat(WORKSPACE_LIMITS.maximumLongTextLength + 1),
    };
    const unsafeImage = {
      ...property,
      overview: {
        ...property.overview,
        coverImage: {
          dataUrl: 'data:text/html;base64,PHNjcmlwdD4=',
          mimeType: 'image/png',
          altText: 'Unsafe',
        },
      },
    };
    const invalidTime = {
      ...property,
      arrivalAccess: { ...property.arrivalAccess, checkInTime: '25:30' },
    };

    expect(isProperty(oversized)).toBe(false);
    expect(isProperty(unsafeImage)).toBe(false);
    expect(isProperty(invalidTime)).toBe(false);
  });

  it('rejects duplicate property IDs and cross-account ownership', () => {
    const property = createDefaultProperty({ id: 'property-1', ownerAccountId: profile.accountId });
    const duplicateWorkspace = {
      ...createEmptyAccountWorkspace(profile),
      properties: [property, property],
    };
    const crossAccountProperty: Property = { ...property, ownerAccountId: 'account-2' };
    const crossAccountWorkspace = {
      ...createEmptyAccountWorkspace(profile),
      properties: [crossAccountProperty],
    };

    expect(isAccountWorkspace(duplicateWorkspace)).toBe(false);
    expect(isAccountWorkspace(crossAccountWorkspace)).toBe(false);
  });

  it('enforces collection limits', () => {
    const properties = Array.from({ length: WORKSPACE_LIMITS.maximumProperties + 1 }, (_, index) =>
      createDefaultProperty({ id: `property-${index}`, ownerAccountId: profile.accountId }),
    );

    expect(isAccountWorkspace({ ...createEmptyAccountWorkspace(profile), properties })).toBe(false);
  });
});
