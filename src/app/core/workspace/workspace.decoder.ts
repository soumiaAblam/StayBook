import type { OwnerProfile } from '../../domain/account';
import {
  isTime24,
  type Breakfast,
  type Checkout,
  type CheckoutItem,
  type Extras,
  type HomeAccess,
  type HomeCare,
  type HomeEssentials,
  type HostSupport,
  type HouseRules,
  type Luggage,
  type NearbyService,
  type OptionalExtra,
  type Parking,
  type Property,
  type PropertyCoverImage,
  type PropertyLocation,
  type PropertyMetadata,
  type PropertyOverview,
  type QuietHours,
  type WifiDetails,
} from '../../domain/property';
import { hasExactlyKeys, isBoundedString, isIsoDateTime, isRecord } from '../storage';
import { ACCOUNT_WORKSPACE_SCHEMA_VERSION, type AccountWorkspace } from './account-workspace.model';

export const WORKSPACE_LIMITS = {
  maximumProperties: 50,
  maximumNearbyServicesPerProperty: 50,
  maximumCheckoutItemsPerProperty: 50,
  maximumIdentifierLength: 128,
  maximumNameLength: 120,
  maximumEmailLength: 254,
  maximumPhoneLength: 40,
  maximumAddressLength: 500,
  maximumMapReferenceLength: 2_048,
  maximumShortTextLength: 300,
  maximumLongTextLength: 4_000,
  maximumCredentialLength: 256,
  maximumImageDataUrlLength: 1_500_000,
} as const;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return isRecord(value) && hasExactlyKeys(value, keys);
}

function isText(value: unknown, maximumLength: number): value is string {
  return isBoundedString(value, 0, maximumLength);
}

function isIdentifier(value: unknown): value is string {
  return (
    isBoundedString(value, 1, WORKSPACE_LIMITS.maximumIdentifierLength) &&
    IDENTIFIER_PATTERN.test(value)
  );
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isNullableImageDataUrl(value: unknown): value is string | null {
  return (
    value === null ||
    (isBoundedString(value, 1, WORKSPACE_LIMITS.maximumImageDataUrlLength) &&
      IMAGE_DATA_URL_PATTERN.test(value))
  );
}

function isOptionalExtra(value: unknown): value is OptionalExtra {
  return (
    isExactRecord(value, ['available', 'instructions']) &&
    typeof value['available'] === 'boolean' &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isCheckoutItem(value: unknown): value is CheckoutItem {
  return (
    isExactRecord(value, ['id', 'label', 'isDefault']) &&
    isIdentifier(value['id']) &&
    isText(value['label'], WORKSPACE_LIMITS.maximumShortTextLength) &&
    typeof value['isDefault'] === 'boolean'
  );
}

function isCheckout(value: unknown): value is Checkout {
  if (
    !isExactRecord(value, ['checkoutTime', 'keyReturn', 'rubbish', 'departureNote', 'checklist']) ||
    !(value['checkoutTime'] === null || isTime24(value['checkoutTime'])) ||
    !isText(value['keyReturn'], WORKSPACE_LIMITS.maximumLongTextLength) ||
    !isText(value['rubbish'], WORKSPACE_LIMITS.maximumLongTextLength) ||
    !isText(value['departureNote'], WORKSPACE_LIMITS.maximumLongTextLength) ||
    !Array.isArray(value['checklist']) ||
    value['checklist'].length > WORKSPACE_LIMITS.maximumCheckoutItemsPerProperty ||
    !value['checklist'].every(isCheckoutItem)
  ) {
    return false;
  }

  const itemIds = value['checklist'].map((item) => item.id);
  return new Set(itemIds).size === itemIds.length;
}

function isBreakfast(value: unknown): value is Breakfast {
  if (!isRecord(value) || !isOneOf(value['kind'], ['unavailable', 'on-request', 'scheduled'])) {
    return false;
  }

  if (value['kind'] === 'unavailable') {
    return hasExactlyKeys(value, ['kind']);
  }

  if (value['kind'] === 'on-request') {
    return (
      hasExactlyKeys(value, ['kind', 'instructions']) &&
      isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
    );
  }

  return (
    hasExactlyKeys(value, ['kind', 'startTime', 'endTime', 'instructions']) &&
    (value['startTime'] === null || isTime24(value['startTime'])) &&
    (value['endTime'] === null || isTime24(value['endTime'])) &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isExtras(value: unknown): value is Extras {
  return (
    isExactRecord(value, [
      'breakfast',
      'lateCheckout',
      'familyEquipment',
      'petStay',
      'specialRequests',
    ]) &&
    isBreakfast(value['breakfast']) &&
    isOptionalExtra(value['lateCheckout']) &&
    isOptionalExtra(value['familyEquipment']) &&
    isOptionalExtra(value['petStay']) &&
    isText(value['specialRequests'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isQuietHours(value: unknown): value is QuietHours {
  return (
    isExactRecord(value, ['startTime', 'endTime']) &&
    (value['startTime'] === null || isTime24(value['startTime'])) &&
    (value['endTime'] === null || isTime24(value['endTime']))
  );
}

function isHouseRules(value: unknown): value is HouseRules {
  const policies = ['allowed', 'ask-host', 'not-allowed'] as const;

  return (
    isExactRecord(value, [
      'quietHours',
      'smoking',
      'events',
      'pets',
      'babies',
      'children',
      'visitors',
      'additionalNote',
    ]) &&
    (value['quietHours'] === null || isQuietHours(value['quietHours'])) &&
    isOneOf(value['smoking'], policies) &&
    isOneOf(value['events'], policies) &&
    isOneOf(value['pets'], policies) &&
    isOneOf(value['babies'], policies) &&
    isOneOf(value['children'], policies) &&
    isOneOf(value['visitors'], policies) &&
    isText(value['additionalNote'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isHomeCare(value: unknown): value is HomeCare {
  return (
    isExactRecord(value, ['heatingAndCooling', 'hotWater', 'powerIssues', 'waste']) &&
    isText(value['heatingAndCooling'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    isText(value['hotWater'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    isText(value['powerIssues'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    isText(value['waste'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isWifiDetails(value: unknown): value is WifiDetails {
  return (
    isExactRecord(value, ['networkName', 'password', 'instructions']) &&
    isText(value['networkName'], WORKSPACE_LIMITS.maximumCredentialLength) &&
    isText(value['password'], WORKSPACE_LIMITS.maximumCredentialLength) &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isHomeEssentials(value: unknown): value is HomeEssentials {
  return (
    isExactRecord(value, ['wifi', 'homeCare']) &&
    (value['wifi'] === null || isWifiDetails(value['wifi'])) &&
    isHomeCare(value['homeCare'])
  );
}

function isHomeAccess(value: unknown): value is HomeAccess {
  return (
    isExactRecord(value, ['method', 'instructions', 'doorCode', 'lockboxCode']) &&
    isOneOf(value['method'], ['door', 'lockbox', 'meet-host', 'other']) &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    isText(value['doorCode'], WORKSPACE_LIMITS.maximumCredentialLength) &&
    isText(value['lockboxCode'], WORKSPACE_LIMITS.maximumCredentialLength)
  );
}

function isPropertyLocation(value: unknown): value is PropertyLocation {
  return (
    isExactRecord(value, ['writtenAddress', 'mapReference', 'directions']) &&
    isText(value['writtenAddress'], WORKSPACE_LIMITS.maximumAddressLength) &&
    isText(value['mapReference'], WORKSPACE_LIMITS.maximumMapReferenceLength) &&
    isText(value['directions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isParking(value: unknown): value is Parking {
  if (
    !isRecord(value) ||
    !isOneOf(value['kind'], ['none', 'ask-host', 'nearby-free', 'nearby-paid', 'on-site'])
  ) {
    return false;
  }

  if (value['kind'] === 'none') {
    return hasExactlyKeys(value, ['kind']);
  }

  return (
    hasExactlyKeys(value, ['kind', 'address', 'instructions']) &&
    isText(value['address'], WORKSPACE_LIMITS.maximumAddressLength) &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isLuggage(value: unknown): value is Luggage {
  if (!isRecord(value) || !isOneOf(value['kind'], ['none', 'internal', 'external-paid'])) {
    return false;
  }

  if (value['kind'] === 'none') {
    return hasExactlyKeys(value, ['kind']);
  }

  if (value['kind'] === 'internal') {
    return (
      hasExactlyKeys(value, ['kind', 'instructions']) &&
      isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
    );
  }

  return (
    hasExactlyKeys(value, ['kind', 'providerName', 'address', 'instructions']) &&
    isText(value['providerName'], WORKSPACE_LIMITS.maximumNameLength) &&
    isText(value['address'], WORKSPACE_LIMITS.maximumAddressLength) &&
    isText(value['instructions'], WORKSPACE_LIMITS.maximumLongTextLength)
  );
}

function isArrivalAccess(value: unknown): value is Property['arrivalAccess'] {
  return (
    isExactRecord(value, [
      'checkInTime',
      'checkInInstructions',
      'location',
      'homeAccess',
      'parking',
      'luggage',
    ]) &&
    (value['checkInTime'] === null || isTime24(value['checkInTime'])) &&
    isText(value['checkInInstructions'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    isPropertyLocation(value['location']) &&
    isHomeAccess(value['homeAccess']) &&
    isParking(value['parking']) &&
    isLuggage(value['luggage'])
  );
}

function isPropertyCoverImage(value: unknown): value is PropertyCoverImage {
  if (
    !isExactRecord(value, ['dataUrl', 'mimeType', 'altText']) ||
    !isOneOf(value['mimeType'], ['image/jpeg', 'image/png', 'image/webp']) ||
    !isBoundedString(value['dataUrl'], 1, WORKSPACE_LIMITS.maximumImageDataUrlLength) ||
    !IMAGE_DATA_URL_PATTERN.test(value['dataUrl']) ||
    !isText(value['altText'], WORKSPACE_LIMITS.maximumShortTextLength)
  ) {
    return false;
  }

  return value['dataUrl'].startsWith(`data:${value['mimeType']};base64,`);
}

function isPropertyOverview(value: unknown): value is PropertyOverview {
  return (
    isExactRecord(value, ['name', 'cityOrArea', 'propertyType', 'welcomeMessage', 'coverImage']) &&
    isText(value['name'], WORKSPACE_LIMITS.maximumNameLength) &&
    isText(value['cityOrArea'], WORKSPACE_LIMITS.maximumShortTextLength) &&
    isOneOf(value['propertyType'], ['apartment', 'house', 'room']) &&
    isText(value['welcomeMessage'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    (value['coverImage'] === null || isPropertyCoverImage(value['coverImage']))
  );
}

function isNearbyService(value: unknown): value is NearbyService {
  if (!isRecord(value)) {
    return false;
  }

  const isTransport = value['category'] === 'transport';
  const expectedKeys = isTransport
    ? [
        'id',
        'title',
        'distanceFromProperty',
        'whyUseful',
        'lastReviewedAt',
        'category',
        'transportType',
      ]
    : ['id', 'title', 'distanceFromProperty', 'whyUseful', 'lastReviewedAt', 'category'];

  return (
    hasExactlyKeys(value, expectedKeys) &&
    isIdentifier(value['id']) &&
    isText(value['title'], WORKSPACE_LIMITS.maximumNameLength) &&
    isText(value['distanceFromProperty'], WORKSPACE_LIMITS.maximumShortTextLength) &&
    isText(value['whyUseful'], WORKSPACE_LIMITS.maximumLongTextLength) &&
    (value['lastReviewedAt'] === null || isIsoDateTime(value['lastReviewedAt'])) &&
    isOneOf(value['category'], ['activity', 'cafe', 'restaurant', 'supermarket', 'transport']) &&
    (!isTransport || isOneOf(value['transportType'], ['public-transport', 'taxi']))
  );
}

function isHostSupport(value: unknown): value is HostSupport {
  return (
    isExactRecord(value, ['name', 'phone', 'email', 'photoDataUrl']) &&
    isText(value['name'], WORKSPACE_LIMITS.maximumNameLength) &&
    isText(value['phone'], WORKSPACE_LIMITS.maximumPhoneLength) &&
    isText(value['email'], WORKSPACE_LIMITS.maximumEmailLength) &&
    isNullableImageDataUrl(value['photoDataUrl'])
  );
}

function isPropertyMetadata(value: unknown): value is PropertyMetadata {
  return (
    isExactRecord(value, ['createdAt', 'updatedAt']) &&
    isIsoDateTime(value['createdAt']) &&
    isIsoDateTime(value['updatedAt'])
  );
}

export function isProperty(value: unknown): value is Property {
  if (
    !isExactRecord(value, [
      'schemaVersion',
      'id',
      'ownerAccountId',
      'overview',
      'arrivalAccess',
      'homeEssentials',
      'houseRules',
      'localGuide',
      'extras',
      'checkout',
      'hostSupport',
      'internalNotes',
      'metadata',
    ]) ||
    value['schemaVersion'] !== 1 ||
    !isIdentifier(value['id']) ||
    !isIdentifier(value['ownerAccountId']) ||
    !isPropertyOverview(value['overview']) ||
    !isArrivalAccess(value['arrivalAccess']) ||
    !isHomeEssentials(value['homeEssentials']) ||
    !isHouseRules(value['houseRules']) ||
    !Array.isArray(value['localGuide']) ||
    value['localGuide'].length > WORKSPACE_LIMITS.maximumNearbyServicesPerProperty ||
    !value['localGuide'].every(isNearbyService) ||
    !isExtras(value['extras']) ||
    !isCheckout(value['checkout']) ||
    !isHostSupport(value['hostSupport']) ||
    !isText(value['internalNotes'], WORKSPACE_LIMITS.maximumLongTextLength) ||
    !isPropertyMetadata(value['metadata'])
  ) {
    return false;
  }

  const serviceIds = value['localGuide'].map((service) => service.id);
  return new Set(serviceIds).size === serviceIds.length;
}

export function isOwnerProfile(value: unknown): value is OwnerProfile {
  return (
    isExactRecord(value, [
      'accountId',
      'displayName',
      'contactEmail',
      'contactPhone',
      'photoDataUrl',
    ]) &&
    isIdentifier(value['accountId']) &&
    isText(value['displayName'], WORKSPACE_LIMITS.maximumNameLength) &&
    isText(value['contactEmail'], WORKSPACE_LIMITS.maximumEmailLength) &&
    isText(value['contactPhone'], WORKSPACE_LIMITS.maximumPhoneLength) &&
    isNullableImageDataUrl(value['photoDataUrl'])
  );
}

export function isAccountWorkspace(value: unknown): value is AccountWorkspace {
  if (
    !isExactRecord(value, ['schemaVersion', 'profile', 'properties']) ||
    value['schemaVersion'] !== ACCOUNT_WORKSPACE_SCHEMA_VERSION ||
    !isOwnerProfile(value['profile']) ||
    !Array.isArray(value['properties']) ||
    value['properties'].length > WORKSPACE_LIMITS.maximumProperties ||
    !value['properties'].every(isProperty)
  ) {
    return false;
  }

  const accountId = value['profile'].accountId;
  const propertyIds = value['properties'].map((property) => property.id);

  return (
    new Set(propertyIds).size === propertyIds.length &&
    value['properties'].every((property) => property.ownerAccountId === accountId)
  );
}
