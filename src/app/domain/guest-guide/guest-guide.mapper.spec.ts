import type { Property } from '../property';
import { createTime24 } from '../property';
import { GuestGuideMapper } from './guest-guide.mapper';

function buildProperty(): Property {
  return {
    schemaVersion: 1,
    id: 'property-casa-olmo',
    ownerAccountId: 'owner-secret-id',
    overview: {
      name: 'Casa Olmo',
      cityOrArea: 'Valencia, Spain',
      propertyType: 'apartment',
      welcomeMessage: 'Welcome to Casa Olmo.',
      coverImage: {
        dataUrl: 'data:image/webp;base64,fictional-cover',
        mimeType: 'image/webp',
        altText: 'Casa Olmo entrance',
      },
    },
    arrivalAccess: {
      checkInTime: createTime24('15:00'),
      checkInInstructions: 'Arrive after the stated time.',
      location: {
        writtenAddress: '10 Example Street, Valencia',
        mapReference: '39.4699,-0.3763',
        directions: 'Use the main entrance.',
      },
      homeAccess: {
        method: 'lockbox',
        instructions: 'The lockbox is beside the door.',
        doorCode: 'door-2468',
        lockboxCode: 'box-1357',
      },
      parking: {
        kind: 'on-site',
        address: 'Private parking address',
        instructions: 'Use space 12.',
      },
      luggage: {
        kind: 'external-paid',
        providerName: 'Example Lockers',
        address: '1 Station Square',
        instructions: 'Book directly.',
      },
    },
    homeEssentials: {
      wifi: {
        networkName: 'private-network',
        password: 'private-wifi-password',
        instructions: 'The router is in the living room.',
      },
      homeCare: {
        heatingAndCooling: 'Use the wall control.',
        hotWater: 'Allow a few minutes.',
        powerIssues: 'Check the labelled switch.',
        waste: 'Use the courtyard bins.',
      },
    },
    houseRules: {
      quietHours: {
        startTime: createTime24('22:00'),
        endTime: createTime24('08:00'),
      },
      smoking: 'not-allowed',
      events: 'not-allowed',
      pets: 'ask-host',
      babies: 'allowed',
      children: 'allowed',
      visitors: 'ask-host',
      additionalNote: 'Respect the neighbours.',
    },
    localGuide: [
      {
        id: 'service-cafe',
        title: 'Example Cafe',
        category: 'cafe',
        distanceFromProperty: '5-minute walk',
        whyUseful: 'Serves breakfast.',
        lastReviewedAt: '2026-07-14T10:00:00.000Z',
      },
      {
        id: 'service-transport',
        title: 'City Taxi',
        category: 'transport',
        transportType: 'taxi',
        distanceFromProperty: 'Phone service',
        whyUseful: 'Runs throughout the city.',
        lastReviewedAt: '2026-07-15T10:00:00.000Z',
      },
    ],
    extras: {
      breakfast: {
        kind: 'scheduled',
        startTime: createTime24('08:00'),
        endTime: createTime24('10:00'),
        instructions: 'Request it the previous day.',
      },
      lateCheckout: {
        available: true,
        instructions: 'Ask before departure day.',
      },
      familyEquipment: {
        available: false,
        instructions: 'owner-only-unavailable-instruction',
      },
      petStay: { available: false, instructions: '' },
      specialRequests: 'Contact the host.',
    },
    checkout: {
      checkoutTime: createTime24('11:00'),
      keyReturn: 'Return the keys to the lockbox.',
      rubbish: 'Use the designated bins.',
      departureNote: 'Tell the host when you leave.',
      checklist: [{ id: 'keys', label: 'Return the keys', isDefault: true }],
    },
    hostSupport: {
      name: 'Alex Morgan',
      phone: '+34 600 000 000',
      email: 'alex@example.test',
      photoDataUrl: 'data:image/webp;base64,fictional-host',
    },
    internalNotes: 'never-show-this-owner-note',
    metadata: {
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-15T10:00:00.000Z',
    },
  };
}

describe('GuestGuideMapper', () => {
  const mapper = new GuestGuideMapper();

  it('creates an explicit home summary without sensitive or owner-only data', () => {
    const summary = mapper.toSummary(buildProperty());
    const serialized = JSON.stringify(summary);

    expect(summary).toEqual({
      propertyId: 'property-casa-olmo',
      propertyName: 'Casa Olmo',
      propertyType: 'apartment',
      cityOrArea: 'Valencia, Spain',
      welcomeMessage: 'Welcome to Casa Olmo.',
      coverImageDataUrl: 'data:image/webp;base64,fictional-cover',
      lastReviewedAt: '2026-07-15T10:00:00.000Z',
      availableDetails: expect.arrayContaining([
        'check-in',
        'home-access',
        'home-address',
        'internet',
        'help',
      ]),
    });
    expect(serialized).not.toContain('owner-secret-id');
    expect(serialized).not.toContain('never-show-this-owner-note');
    expect(serialized).not.toContain('door-2468');
    expect(serialized).not.toContain('box-1357');
    expect(serialized).not.toContain('private-wifi-password');
    expect(serialized).not.toContain('10 Example Street');
    expect(serialized).not.toContain('+34 600 000 000');
  });

  it('projects access codes only into the Home access detail DTO', () => {
    const property = buildProperty();
    const homeAccess = mapper.toDetail(property, 'home-access');

    expect(homeAccess).toEqual({
      kind: 'home-access',
      method: 'lockbox',
      instructions: 'The lockbox is beside the door.',
      doorCode: 'door-2468',
      lockboxCode: 'box-1357',
    });

    for (const detailKind of [
      'check-in',
      'home-address',
      'internet',
      'help',
      'local-guide',
      'transport',
    ] as const) {
      const serialized = JSON.stringify(mapper.toDetail(property, detailKind));
      expect(serialized).not.toContain('door-2468');
      expect(serialized).not.toContain('box-1357');
    }
  });

  it('isolates each other sensitive value in its relevant detail DTO', () => {
    const property = buildProperty();

    expect(mapper.toDetail(property, 'home-address')).toEqual({
      kind: 'home-address',
      writtenAddress: '10 Example Street, Valencia',
      mapReference: '39.4699,-0.3763',
      directions: 'Use the main entrance.',
    });
    expect(mapper.toDetail(property, 'internet')).toEqual({
      kind: 'internet',
      networkName: 'private-network',
      password: 'private-wifi-password',
      instructions: 'The router is in the living room.',
    });
    expect(mapper.toDetail(property, 'help')).toEqual({
      kind: 'help',
      emergencyNumber: '112',
      host: {
        name: 'Alex Morgan',
        phone: '+34 600 000 000',
        email: 'alex@example.test',
        photoDataUrl: 'data:image/webp;base64,fictional-host',
      },
    });
  });

  it('separates general local services from transport details', () => {
    const property = buildProperty();
    const localGuide = mapper.toDetail(property, 'local-guide');
    const transport = mapper.toDetail(property, 'transport');

    expect(localGuide).toEqual({
      kind: 'local-guide',
      services: [
        expect.objectContaining({
          id: 'service-cafe',
          category: 'cafe',
          lastReviewedAt: '2026-07-14T10:00:00.000Z',
        }),
      ],
    });
    expect(transport).toEqual({
      kind: 'transport',
      services: [
        expect.objectContaining({
          id: 'service-transport',
          category: 'transport',
          transportType: 'taxi',
          lastReviewedAt: '2026-07-15T10:00:00.000Z',
        }),
      ],
    });
  });

  it('does not leak owner-only checkout or unavailable-extra metadata', () => {
    const property = buildProperty();
    const checkout = JSON.stringify(mapper.toDetail(property, 'checkout'));
    const extras = JSON.stringify(mapper.toDetail(property, 'extras'));

    expect(checkout).toContain('Return the keys');
    expect(checkout).not.toContain('isDefault');
    expect(extras).not.toContain('owner-only-unavailable-instruction');
    expect(extras).not.toContain('available');
  });

  it('returns no detail DTO when optional access data is empty', () => {
    const property = buildProperty();
    const withoutAccess: Property = {
      ...property,
      arrivalAccess: {
        ...property.arrivalAccess,
        homeAccess: {
          method: 'other',
          instructions: ' ',
          doorCode: '',
          lockboxCode: '',
        },
      },
    };

    expect(mapper.toDetail(withoutAccess, 'home-access')).toBeNull();
    expect(mapper.toSummary(withoutAccess).availableDetails).not.toContain('home-access');
  });
});
