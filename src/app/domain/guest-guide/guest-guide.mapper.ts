import type { Luggage, NearbyService, Parking, Property } from '../property';
import type {
  GuestCheckoutDetailDto,
  GuestExtrasDetailDto,
  GuestGuideDetailDto,
  GuestGuideDetailKind,
  GuestGuideSummaryDto,
  GuestHelpDetailDto,
  GuestHomeAccessDetailDto,
  GuestHomeAddressDetailDto,
  GuestHomeCareDetailDto,
  GuestHouseRulesDetailDto,
  GuestInternetDetailDto,
  GuestLocalGuideDetailDto,
  GuestLuggageDetailDto,
  GuestNearbyServiceDto,
  GuestParkingDetailDto,
  GuestTransportDetailDto,
} from './guest-guide.model';

const DETAIL_KINDS: readonly GuestGuideDetailKind[] = [
  'check-in',
  'home-access',
  'home-address',
  'luggage',
  'parking',
  'internet',
  'home-care',
  'house-rules',
  'help',
  'local-guide',
  'transport',
  'extras',
  'checkout',
];

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function optionalText<Key extends string>(
  key: Key,
  value: string,
): Readonly<Partial<Record<Key, string>>> {
  return (hasText(value) ? { [key]: value } : {}) as Readonly<Partial<Record<Key, string>>>;
}

function mapParking(parking: Parking): GuestParkingDetailDto {
  if (parking.kind === 'none') {
    return { kind: 'parking', parking: { kind: 'none' } };
  }

  return {
    kind: 'parking',
    parking: {
      kind: parking.kind,
      address: parking.address,
      instructions: parking.instructions,
    },
  };
}

function mapLuggage(luggage: Luggage): GuestLuggageDetailDto {
  switch (luggage.kind) {
    case 'none':
      return { kind: 'luggage', luggage: { kind: 'none' } };
    case 'internal':
      return {
        kind: 'luggage',
        luggage: {
          kind: 'internal',
          instructions: luggage.instructions,
        },
      };
    case 'external-paid':
      return {
        kind: 'luggage',
        luggage: {
          kind: 'external-paid',
          providerName: luggage.providerName,
          address: luggage.address,
          instructions: luggage.instructions,
        },
      };
  }
}

function mapBreakfast(
  breakfast: Property['extras']['breakfast'],
): GuestExtrasDetailDto['breakfast'] {
  switch (breakfast.kind) {
    case 'unavailable':
      return { kind: 'unavailable' };
    case 'on-request':
      return {
        kind: 'on-request',
        instructions: breakfast.instructions,
      };
    case 'scheduled':
      return {
        kind: 'scheduled',
        startTime: breakfast.startTime,
        endTime: breakfast.endTime,
        instructions: breakfast.instructions,
      };
  }
}

function mapNearbyService(service: NearbyService): GuestNearbyServiceDto {
  return {
    id: service.id,
    title: service.title,
    category: service.category,
    ...(service.category === 'transport' ? { transportType: service.transportType } : {}),
    distanceFromProperty: service.distanceFromProperty,
    whyUseful: service.whyUseful,
    ...(service.lastReviewedAt === null ? {} : { lastReviewedAt: service.lastReviewedAt }),
  };
}

function mapHomeAccess(property: Property): GuestHomeAccessDetailDto | null {
  const access = property.arrivalAccess.homeAccess;
  if (!hasText(access.instructions) && !hasText(access.doorCode) && !hasText(access.lockboxCode)) {
    return null;
  }

  return {
    kind: 'home-access',
    method: access.method,
    ...optionalText('instructions', access.instructions),
    ...optionalText('doorCode', access.doorCode),
    ...optionalText('lockboxCode', access.lockboxCode),
  };
}

function mapHomeAddress(property: Property): GuestHomeAddressDetailDto | null {
  const location = property.arrivalAccess.location;
  if (!hasText(location.writtenAddress)) {
    return null;
  }

  return {
    kind: 'home-address',
    writtenAddress: location.writtenAddress,
    ...optionalText('mapReference', location.mapReference),
    ...optionalText('directions', location.directions),
  };
}

function mapInternet(property: Property): GuestInternetDetailDto | null {
  const wifi = property.homeEssentials.wifi;
  if (wifi === null || ![wifi.networkName, wifi.password, wifi.instructions].some(hasText)) {
    return null;
  }

  return {
    kind: 'internet',
    ...optionalText('networkName', wifi.networkName),
    ...optionalText('password', wifi.password),
    ...optionalText('instructions', wifi.instructions),
  };
}

function mapHomeCare(property: Property): GuestHomeCareDetailDto | null {
  const homeCare = property.homeEssentials.homeCare;
  if (
    ![homeCare.heatingAndCooling, homeCare.hotWater, homeCare.powerIssues, homeCare.waste].some(
      hasText,
    )
  ) {
    return null;
  }

  return {
    kind: 'home-care',
    ...optionalText('heatingAndCooling', homeCare.heatingAndCooling),
    ...optionalText('hotWater', homeCare.hotWater),
    ...optionalText('powerIssues', homeCare.powerIssues),
    ...optionalText('waste', homeCare.waste),
  };
}

function mapHouseRules(property: Property): GuestHouseRulesDetailDto {
  const rules = property.houseRules;
  const quietHours = rules.quietHours;

  return {
    kind: 'house-rules',
    ...(quietHours === null
      ? {}
      : {
          quietHours: {
            ...(quietHours.startTime === null ? {} : { startTime: quietHours.startTime }),
            ...(quietHours.endTime === null ? {} : { endTime: quietHours.endTime }),
          },
        }),
    smoking: rules.smoking,
    events: rules.events,
    pets: rules.pets,
    babies: rules.babies,
    children: rules.children,
    visitors: rules.visitors,
    ...optionalText('additionalNote', rules.additionalNote),
  };
}

function mapHelp(property: Property): GuestHelpDetailDto {
  const support = property.hostSupport;
  const hasHost = [support.name, support.phone, support.email].some(hasText);

  return {
    kind: 'help',
    emergencyNumber: '112',
    ...(hasHost
      ? {
          host: {
            ...optionalText('name', support.name),
            ...optionalText('phone', support.phone),
            ...optionalText('email', support.email),
            ...(support.photoDataUrl === null || !hasText(support.photoDataUrl)
              ? {}
              : { photoDataUrl: support.photoDataUrl }),
          },
        }
      : {}),
  };
}

function mapLocalGuide(property: Property): GuestLocalGuideDetailDto | null {
  const services = property.localGuide
    .filter((service) => service.category !== 'transport')
    .map(mapNearbyService);

  return services.length === 0 ? null : { kind: 'local-guide', services };
}

function mapTransport(property: Property): GuestTransportDetailDto | null {
  const services = property.localGuide
    .filter(
      (service): service is Extract<NearbyService, { category: 'transport' }> =>
        service.category === 'transport',
    )
    .map((service) => ({
      ...mapNearbyService(service),
      category: 'transport' as const,
      transportType: service.transportType,
    }));

  return services.length === 0 ? null : { kind: 'transport', services };
}

function mapExtras(property: Property): GuestExtrasDetailDto {
  const extras = property.extras;

  return {
    kind: 'extras',
    breakfast: mapBreakfast(extras.breakfast),
    ...(extras.lateCheckout.available
      ? optionalText('lateCheckout', extras.lateCheckout.instructions)
      : {}),
    ...(extras.familyEquipment.available
      ? optionalText('familyEquipment', extras.familyEquipment.instructions)
      : {}),
    ...(extras.petStay.available ? optionalText('petStay', extras.petStay.instructions) : {}),
    ...optionalText('specialRequests', extras.specialRequests),
  };
}

function mapCheckout(property: Property): GuestCheckoutDetailDto | null {
  const checkout = property.checkout;
  if (
    checkout.checkoutTime === null &&
    ![checkout.keyReturn, checkout.rubbish, checkout.departureNote].some(hasText) &&
    checkout.checklist.length === 0
  ) {
    return null;
  }

  return {
    kind: 'checkout',
    ...(checkout.checkoutTime === null ? {} : { checkoutTime: checkout.checkoutTime }),
    ...optionalText('keyReturn', checkout.keyReturn),
    ...optionalText('rubbish', checkout.rubbish),
    ...optionalText('departureNote', checkout.departureNote),
    checklist: checkout.checklist.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  };
}

export class GuestGuideMapper {
  toSummary(property: Property): GuestGuideSummaryDto {
    const availableDetails = DETAIL_KINDS.filter((kind) => this.toDetail(property, kind) !== null);

    return {
      propertyId: property.id,
      propertyName: property.overview.name,
      propertyType: property.overview.propertyType,
      cityOrArea: property.overview.cityOrArea,
      ...(property.overview.coverImage === null
        ? {}
        : { coverImageDataUrl: property.overview.coverImage.dataUrl }),
      lastReviewedAt: property.metadata.updatedAt,
      availableDetails,
    };
  }

  toDetail(property: Property, kind: GuestGuideDetailKind): GuestGuideDetailDto | null {
    switch (kind) {
      case 'check-in': {
        const arrival = property.arrivalAccess;
        if (arrival.checkInTime === null && !hasText(arrival.checkInInstructions)) {
          return null;
        }

        return {
          kind: 'check-in',
          ...(arrival.checkInTime === null ? {} : { checkInTime: arrival.checkInTime }),
          ...optionalText('instructions', arrival.checkInInstructions),
        };
      }
      case 'home-access':
        return mapHomeAccess(property);
      case 'home-address':
        return mapHomeAddress(property);
      case 'luggage':
        return mapLuggage(property.arrivalAccess.luggage);
      case 'parking':
        return mapParking(property.arrivalAccess.parking);
      case 'internet':
        return mapInternet(property);
      case 'home-care':
        return mapHomeCare(property);
      case 'house-rules':
        return mapHouseRules(property);
      case 'help':
        return mapHelp(property);
      case 'local-guide':
        return mapLocalGuide(property);
      case 'transport':
        return mapTransport(property);
      case 'extras':
        return mapExtras(property);
      case 'checkout':
        return mapCheckout(property);
    }
  }
}
