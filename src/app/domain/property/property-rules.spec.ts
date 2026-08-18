import type { Property } from './property.model';
import {
  calculatePropertyCompletion,
  markNearbyServiceReviewed,
  validateProperty,
} from './property-rules';
import { createTime24 } from './time-24';

function buildCompleteProperty(): Property {
  return {
    schemaVersion: 1,
    id: 'property-casa-olmo',
    ownerAccountId: 'account-fixture',
    overview: {
      name: 'Casa Olmo',
      cityOrArea: 'Valencia, Spain',
      propertyType: 'apartment',
      welcomeMessage: 'Welcome to Casa Olmo.',
      coverImage: null,
    },
    arrivalAccess: {
      checkInTime: createTime24('15:00'),
      checkInInstructions: 'Check in after the stated time.',
      location: {
        writtenAddress: '10 Example Street, Valencia',
        mapReference: '39.4699,-0.3763',
        directions: 'Use the main entrance.',
      },
      homeAccess: {
        method: 'lockbox',
        instructions: 'The lockbox is beside the main door.',
        doorCode: '2468',
        lockboxCode: '1357',
      },
      parking: {
        kind: 'nearby-paid',
        address: '12 Example Street, Valencia',
        instructions: 'Use level one.',
      },
      luggage: {
        kind: 'external-paid',
        providerName: 'Example Lockers',
        address: '1 Station Square, Valencia',
        instructions: 'Book directly with the provider.',
      },
    },
    homeEssentials: {
      wifi: {
        networkName: 'CasaOlmo Guest',
        password: 'fictional-password',
        instructions: 'Connect from the living room.',
      },
      homeCare: {
        heatingAndCooling: 'Use the wall control.',
        hotWater: 'Allow a few minutes after heavy use.',
        powerIssues: 'Check the labelled switch.',
        waste: 'Use the bins in the courtyard.',
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
      additionalNote: 'Please respect the neighbours.',
    },
    localGuide: [
      {
        id: 'service-cafe',
        title: 'Example Cafe',
        category: 'cafe',
        distanceFromProperty: '5-minute walk',
        whyUseful: 'A convenient breakfast option.',
        lastReviewedAt: '2026-07-15T10:00:00.000Z',
      },
      {
        id: 'service-taxi',
        title: 'City Taxi',
        category: 'transport',
        transportType: 'taxi',
        distanceFromProperty: 'Phone service',
        whyUseful: 'Available throughout the city.',
        lastReviewedAt: '2026-07-15T10:00:00.000Z',
      },
    ],
    extras: {
      breakfast: {
        kind: 'scheduled',
        startTime: createTime24('08:00'),
        endTime: createTime24('10:00'),
        instructions: 'Request breakfast the previous day.',
      },
      lateCheckout: {
        available: true,
        instructions: 'Ask before departure day.',
      },
      familyEquipment: {
        available: true,
        instructions: 'A cot is available on request.',
      },
      petStay: {
        available: false,
        instructions: '',
      },
      specialRequests: 'Contact the host.',
    },
    checkout: {
      checkoutTime: createTime24('11:00'),
      keyReturn: 'Return the key to the lockbox.',
      rubbish: 'Leave rubbish in the designated bins.',
      departureNote: 'Tell the host when you leave.',
      checklist: [{ id: 'item-keys', label: 'Return the keys', isDefault: true }],
    },
    hostSupport: {
      name: 'Alex Morgan',
      phone: '+34 600 000 000',
      email: 'alex@example.test',
      photoDataUrl: null,
    },
    internalNotes: 'Owner-only note.',
    metadata: {
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-15T10:00:00.000Z',
    },
  };
}

describe('property validation rules', () => {
  it('accepts a complete property and calculates all seven sections', () => {
    const property = buildCompleteProperty();

    expect(validateProperty(property)).toEqual([]);
    expect(calculatePropertyCompletion(property)).toEqual(
      expect.objectContaining({
        complete: true,
        completedSections: 7,
        totalSections: 7,
        percentage: 100,
      }),
    );
  });

  it('requires a parking address for every choice except no parking', () => {
    const property = buildCompleteProperty();
    const withoutParkingAddress: Property = {
      ...property,
      arrivalAccess: {
        ...property.arrivalAccess,
        parking: { kind: 'on-site', address: '  ', instructions: '' },
      },
    };
    const noParking: Property = {
      ...property,
      arrivalAccess: {
        ...property.arrivalAccess,
        parking: { kind: 'none' },
      },
    };

    expect(validateProperty(withoutParkingAddress)).toContainEqual({
      code: 'parking-address-required',
      section: 'arrival-access',
      path: 'arrivalAccess.parking.address',
    });
    expect(validateProperty(noParking)).not.toContainEqual(
      expect.objectContaining({ code: 'parking-address-required' }),
    );
  });

  it('requires both quiet-hour values but supports an overnight range', () => {
    const property = buildCompleteProperty();
    const partialQuietHours: Property = {
      ...property,
      houseRules: {
        ...property.houseRules,
        quietHours: { startTime: createTime24('22:00'), endTime: null },
      },
    };

    expect(validateProperty(partialQuietHours)).toContainEqual({
      code: 'quiet-hours-incomplete',
      section: 'house-rules',
      path: 'houseRules.quietHours',
    });
    expect(validateProperty(property)).not.toContainEqual(
      expect.objectContaining({ code: 'quiet-hours-invalid' }),
    );
  });

  it('requires scheduled breakfast hours in chronological order', () => {
    const property = buildCompleteProperty();
    const reversedBreakfast: Property = {
      ...property,
      extras: {
        ...property.extras,
        breakfast: {
          kind: 'scheduled',
          startTime: createTime24('10:00'),
          endTime: createTime24('08:00'),
          instructions: '',
        },
      },
    };

    expect(validateProperty(reversedBreakfast)).toContainEqual({
      code: 'breakfast-hours-order',
      section: 'extras',
      path: 'extras.breakfast',
    });
  });

  it('requires a subtype only for transport recommendations', () => {
    const property = buildCompleteProperty();
    const invalidTransport = {
      ...property.localGuide[1],
      transportType: undefined,
    } as unknown as Property['localGuide'][number];
    const cafeWithTransportType = {
      ...property.localGuide[0],
      transportType: 'taxi',
    } as unknown as Property['localGuide'][number];
    const malformed: Property = {
      ...property,
      localGuide: [invalidTransport, cafeWithTransportType],
    };
    const issues = validateProperty(malformed);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'local-service-transport-type-required',
          path: 'localGuide.0.transportType',
        }),
        expect.objectContaining({
          code: 'local-service-transport-type-forbidden',
          path: 'localGuide.1.transportType',
        }),
      ]),
    );
  });

  it('derives incomplete sections instead of persisting a manual percentage', () => {
    const property = buildCompleteProperty();
    const incomplete: Property = {
      ...property,
      overview: { ...property.overview, name: '' },
      localGuide: [],
    };
    const completion = calculatePropertyCompletion(incomplete);

    expect(completion.complete).toBe(false);
    expect(completion.completedSections).toBe(5);
    expect(completion.percentage).toBe(71);
    expect(completion.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ section: 'overview', complete: false }),
        expect.objectContaining({ section: 'local-guide', complete: false }),
      ]),
    );
  });

  it('sets recommendation review metadata from a trusted clock value', () => {
    const service = buildCompleteProperty().localGuide[0];
    const reviewedAt = '2026-08-13T12:00:00.000Z';

    expect(markNearbyServiceReviewed(service, reviewedAt).lastReviewedAt).toBe(reviewedAt);
    expect(() => markNearbyServiceReviewed(service, 'not-a-date')).toThrow(RangeError);
  });
});
