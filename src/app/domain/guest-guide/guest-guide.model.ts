import type {
  AccessMethod,
  NearbyServiceCategory,
  PropertyType,
  RulePolicy,
  Time24,
  TransportType,
} from '../property';

export type GuestGuideDetailKind =
  | 'check-in'
  | 'checkout'
  | 'extras'
  | 'help'
  | 'home-access'
  | 'home-address'
  | 'home-care'
  | 'house-rules'
  | 'internet'
  | 'local-guide'
  | 'luggage'
  | 'parking'
  | 'transport';

export interface GuestGuideSummaryDto {
  readonly propertyId: string;
  readonly propertyName: string;
  readonly propertyType: PropertyType;
  readonly cityOrArea: string;
  readonly coverImageDataUrl?: string;
  readonly lastReviewedAt: string;
  readonly availableDetails: readonly GuestGuideDetailKind[];
}

export interface GuestCheckInDetailDto {
  readonly kind: 'check-in';
  readonly checkInTime?: Time24;
  readonly instructions?: string;
}

export interface GuestHomeAccessDetailDto {
  readonly kind: 'home-access';
  readonly method: AccessMethod;
  readonly instructions?: string;
  readonly doorCode?: string;
  readonly lockboxCode?: string;
}

export interface GuestHomeAddressDetailDto {
  readonly kind: 'home-address';
  readonly writtenAddress: string;
  readonly mapReference?: string;
  readonly directions?: string;
}

export type GuestParkingDetailDto =
  | { readonly kind: 'parking'; readonly parking: { readonly kind: 'none' } }
  | {
      readonly kind: 'parking';
      readonly parking: {
        readonly kind: 'ask-host' | 'nearby-free' | 'nearby-paid' | 'on-site';
        readonly address: string;
        readonly instructions: string;
      };
    };

export type GuestLuggageDetailDto =
  | { readonly kind: 'luggage'; readonly luggage: { readonly kind: 'none' } }
  | {
      readonly kind: 'luggage';
      readonly luggage: {
        readonly kind: 'internal';
        readonly instructions: string;
      };
    }
  | {
      readonly kind: 'luggage';
      readonly luggage: {
        readonly kind: 'external-paid';
        readonly providerName: string;
        readonly address: string;
        readonly instructions: string;
      };
    };

export interface GuestInternetDetailDto {
  readonly kind: 'internet';
  readonly networkName?: string;
  readonly password?: string;
  readonly instructions?: string;
}

export interface GuestHomeCareDetailDto {
  readonly kind: 'home-care';
  readonly heatingAndCooling?: string;
  readonly hotWater?: string;
  readonly powerIssues?: string;
  readonly waste?: string;
}

export interface GuestHouseRulesDetailDto {
  readonly kind: 'house-rules';
  readonly quietHours?: {
    readonly startTime?: Time24;
    readonly endTime?: Time24;
  };
  readonly smoking: RulePolicy;
  readonly events: RulePolicy;
  readonly pets: RulePolicy;
  readonly babies: RulePolicy;
  readonly children: RulePolicy;
  readonly visitors: RulePolicy;
  readonly additionalNote?: string;
}

export interface GuestHelpDetailDto {
  readonly kind: 'help';
  readonly emergencyNumber: '112';
  readonly host?: {
    readonly name?: string;
    readonly phone?: string;
    readonly email?: string;
    readonly photoDataUrl?: string;
  };
}

export interface GuestNearbyServiceDto {
  readonly id: string;
  readonly title: string;
  readonly category: NearbyServiceCategory;
  readonly transportType?: TransportType;
  readonly distanceFromProperty: string;
  readonly whyUseful: string;
  readonly lastReviewedAt?: string;
}

export interface GuestLocalGuideDetailDto {
  readonly kind: 'local-guide';
  readonly services: readonly GuestNearbyServiceDto[];
}

export interface GuestTransportDetailDto {
  readonly kind: 'transport';
  readonly services: readonly (GuestNearbyServiceDto & {
    readonly category: 'transport';
    readonly transportType: TransportType;
  })[];
}

export interface GuestExtrasDetailDto {
  readonly kind: 'extras';
  readonly breakfast:
    | { readonly kind: 'unavailable' }
    | { readonly kind: 'on-request'; readonly instructions: string }
    | {
        readonly kind: 'scheduled';
        readonly startTime: Time24 | null;
        readonly endTime: Time24 | null;
        readonly instructions: string;
      };
  readonly lateCheckout?: string;
  readonly familyEquipment?: string;
  readonly petStay?: string;
  readonly specialRequests?: string;
}

export interface GuestCheckoutDetailDto {
  readonly kind: 'checkout';
  readonly checkoutTime?: Time24;
  readonly keyReturn?: string;
  readonly rubbish?: string;
  readonly departureNote?: string;
  readonly checklist: readonly {
    readonly id: string;
    readonly label: string;
  }[];
}

export type GuestGuideDetailDto =
  | GuestCheckInDetailDto
  | GuestCheckoutDetailDto
  | GuestExtrasDetailDto
  | GuestHelpDetailDto
  | GuestHomeAccessDetailDto
  | GuestHomeAddressDetailDto
  | GuestHomeCareDetailDto
  | GuestHouseRulesDetailDto
  | GuestInternetDetailDto
  | GuestLocalGuideDetailDto
  | GuestLuggageDetailDto
  | GuestParkingDetailDto
  | GuestTransportDetailDto;
