import type { AccountId } from '../account';
import type { Time24 } from './time-24';

export type PropertyId = string;
export type NearbyServiceId = string;
export type CheckoutItemId = string;

export type PropertyType = 'apartment' | 'house' | 'room';
export type AccessMethod = 'door' | 'lockbox' | 'meet-host' | 'other';
export type RulePolicy = 'allowed' | 'ask-host' | 'not-allowed';

export type ParkingKind = 'ask-host' | 'nearby-free' | 'nearby-paid' | 'on-site';

export type Parking =
  | { readonly kind: 'none' }
  | {
      readonly kind: ParkingKind;
      readonly address: string;
      readonly instructions: string;
    };

export type Luggage =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'internal';
      readonly instructions: string;
    }
  | {
      readonly kind: 'external-paid';
      readonly providerName: string;
      readonly address: string;
      readonly instructions: string;
    };

export type Breakfast =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'on-request';
      readonly instructions: string;
    }
  | {
      readonly kind: 'scheduled';
      readonly startTime: Time24 | null;
      readonly endTime: Time24 | null;
      readonly instructions: string;
    };

export type NearbyServiceCategory =
  'activity' | 'cafe' | 'restaurant' | 'supermarket' | 'transport';

export type TransportType = 'public-transport' | 'taxi';

interface NearbyServiceBase {
  readonly id: NearbyServiceId;
  readonly title: string;
  readonly distanceFromProperty: string;
  readonly whyUseful: string;
  readonly lastReviewedAt: string | null;
}

export type NearbyService =
  | (NearbyServiceBase & {
      readonly category: Exclude<NearbyServiceCategory, 'transport'>;
      readonly transportType?: never;
    })
  | (NearbyServiceBase & {
      readonly category: 'transport';
      readonly transportType: TransportType;
    });

export interface PropertyCoverImage {
  readonly dataUrl: string;
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly altText: string;
}

export interface PropertyOverview {
  readonly name: string;
  readonly cityOrArea: string;
  readonly propertyType: PropertyType;
  readonly welcomeMessage: string;
  readonly coverImage: PropertyCoverImage | null;
}

export interface PropertyLocation {
  readonly writtenAddress: string;
  readonly mapReference: string;
  readonly directions: string;
}

export interface HomeAccess {
  readonly method: AccessMethod;
  readonly instructions: string;
  readonly doorCode: string;
  readonly lockboxCode: string;
}

export interface ArrivalAccess {
  readonly checkInTime: Time24 | null;
  readonly checkInInstructions: string;
  readonly location: PropertyLocation;
  readonly homeAccess: HomeAccess;
  readonly parking: Parking;
  readonly luggage: Luggage;
}

export interface WifiDetails {
  readonly networkName: string;
  readonly password: string;
  readonly instructions: string;
}

export interface HomeCare {
  readonly heatingAndCooling: string;
  readonly hotWater: string;
  readonly powerIssues: string;
  readonly waste: string;
}

export interface HomeEssentials {
  readonly wifi: WifiDetails | null;
  readonly homeCare: HomeCare;
}

export interface QuietHours {
  readonly startTime: Time24 | null;
  readonly endTime: Time24 | null;
}

export interface HouseRules {
  readonly quietHours: QuietHours | null;
  readonly smoking: RulePolicy;
  readonly events: RulePolicy;
  readonly pets: RulePolicy;
  readonly babies: RulePolicy;
  readonly children: RulePolicy;
  readonly visitors: RulePolicy;
  readonly additionalNote: string;
}

export interface OptionalExtra {
  readonly available: boolean;
  readonly instructions: string;
}

export interface Extras {
  readonly breakfast: Breakfast;
  readonly lateCheckout: OptionalExtra;
  readonly familyEquipment: OptionalExtra;
  readonly petStay: OptionalExtra;
  readonly specialRequests: string;
}

export interface CheckoutItem {
  readonly id: CheckoutItemId;
  readonly label: string;
  readonly isDefault: boolean;
}

export interface Checkout {
  readonly checkoutTime: Time24 | null;
  readonly keyReturn: string;
  readonly rubbish: string;
  readonly departureNote: string;
  readonly checklist: readonly CheckoutItem[];
}

export interface HostSupport {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly photoDataUrl: string | null;
}

export interface PropertyMetadata {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Property {
  readonly schemaVersion: 1;
  readonly id: PropertyId;
  readonly ownerAccountId: AccountId;
  readonly overview: PropertyOverview;
  readonly arrivalAccess: ArrivalAccess;
  readonly homeEssentials: HomeEssentials;
  readonly houseRules: HouseRules;
  readonly localGuide: readonly NearbyService[];
  readonly extras: Extras;
  readonly checkout: Checkout;
  readonly hostSupport: HostSupport;
  readonly internalNotes: string;
  readonly metadata: PropertyMetadata;
}
