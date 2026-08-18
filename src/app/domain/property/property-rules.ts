import { isChronologicalTimeRange, isTime24, type Time24 } from './time-24';
import type {
  NearbyService,
  NearbyServiceCategory,
  Property,
  TransportType,
} from './property.model';

export type PropertySectionId =
  | 'arrival-access'
  | 'checkout'
  | 'extras'
  | 'home-essentials'
  | 'house-rules'
  | 'local-guide'
  | 'overview';

export type PropertyValidationCode =
  | 'breakfast-hours-incomplete'
  | 'breakfast-hours-invalid'
  | 'breakfast-hours-order'
  | 'checkout-time-required'
  | 'check-in-time-required'
  | 'home-access-required'
  | 'home-essentials-required'
  | 'local-service-field-required'
  | 'local-service-transport-type-forbidden'
  | 'local-service-transport-type-required'
  | 'parking-address-required'
  | 'property-field-required'
  | 'quiet-hours-incomplete'
  | 'quiet-hours-invalid'
  | 'quiet-hours-identical';

export interface PropertyValidationIssue {
  readonly code: PropertyValidationCode;
  readonly section: PropertySectionId;
  readonly path: string;
}

export interface PropertySectionCompletion {
  readonly section: PropertySectionId;
  readonly complete: boolean;
  readonly missingFields: readonly string[];
}

export interface PropertyCompletion {
  readonly complete: boolean;
  readonly completedSections: number;
  readonly totalSections: 7;
  readonly percentage: number;
  readonly sections: readonly PropertySectionCompletion[];
}

const VALID_CATEGORIES: readonly NearbyServiceCategory[] = [
  'activity',
  'cafe',
  'restaurant',
  'supermarket',
  'transport',
];

const VALID_TRANSPORT_TYPES: readonly TransportType[] = ['public-transport', 'taxi'];

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function addIssue(
  issues: PropertyValidationIssue[],
  code: PropertyValidationCode,
  section: PropertySectionId,
  path: string,
): void {
  issues.push({ code, section, path });
}

function validateTimePair(
  issues: PropertyValidationIssue[],
  section: PropertySectionId,
  path: string,
  startTime: Time24 | null,
  endTime: Time24 | null,
  rules: {
    readonly incomplete: PropertyValidationCode;
    readonly invalid: PropertyValidationCode;
    readonly identical: PropertyValidationCode;
    readonly chronological: boolean;
  },
): void {
  if ((startTime === null) !== (endTime === null)) {
    addIssue(issues, rules.incomplete, section, path);
    return;
  }

  if (startTime === null || endTime === null) {
    return;
  }

  if (!isTime24(startTime) || !isTime24(endTime)) {
    addIssue(issues, rules.invalid, section, path);
    return;
  }

  if (startTime === endTime) {
    addIssue(issues, rules.identical, section, path);
    return;
  }

  if (rules.chronological && !isChronologicalTimeRange(startTime, endTime)) {
    addIssue(issues, 'breakfast-hours-order', section, path);
  }
}

function validateNearbyService(
  service: NearbyService,
  index: number,
  issues: PropertyValidationIssue[],
): void {
  const basePath = `localGuide.${index}`;

  for (const [field, value] of [
    ['title', service.title],
    ['distanceFromProperty', service.distanceFromProperty],
    ['whyUseful', service.whyUseful],
  ] as const) {
    if (isBlank(value)) {
      addIssue(issues, 'local-service-field-required', 'local-guide', `${basePath}.${field}`);
    }
  }

  if (!VALID_CATEGORIES.includes(service.category)) {
    addIssue(issues, 'local-service-field-required', 'local-guide', `${basePath}.category`);
    return;
  }

  const transportType = (service as { readonly transportType?: unknown }).transportType;

  if (service.category === 'transport') {
    if (
      typeof transportType !== 'string' ||
      !VALID_TRANSPORT_TYPES.includes(transportType as TransportType)
    ) {
      addIssue(
        issues,
        'local-service-transport-type-required',
        'local-guide',
        `${basePath}.transportType`,
      );
    }
  } else if (transportType !== undefined) {
    addIssue(
      issues,
      'local-service-transport-type-forbidden',
      'local-guide',
      `${basePath}.transportType`,
    );
  }
}

export function validateProperty(property: Property): readonly PropertyValidationIssue[] {
  const issues: PropertyValidationIssue[] = [];

  for (const [field, value] of [
    ['name', property.overview.name],
    ['cityOrArea', property.overview.cityOrArea],
  ] as const) {
    if (isBlank(value)) {
      addIssue(issues, 'property-field-required', 'overview', `overview.${field}`);
    }
  }

  if (
    property.arrivalAccess.checkInTime === null ||
    !isTime24(property.arrivalAccess.checkInTime)
  ) {
    addIssue(issues, 'check-in-time-required', 'arrival-access', 'arrivalAccess.checkInTime');
  }

  if (isBlank(property.arrivalAccess.location.writtenAddress)) {
    addIssue(
      issues,
      'property-field-required',
      'arrival-access',
      'arrivalAccess.location.writtenAddress',
    );
  }

  if (isBlank(property.arrivalAccess.homeAccess.instructions)) {
    addIssue(
      issues,
      'home-access-required',
      'arrival-access',
      'arrivalAccess.homeAccess.instructions',
    );
  }

  if (
    property.arrivalAccess.parking.kind !== 'none' &&
    isBlank(property.arrivalAccess.parking.address)
  ) {
    addIssue(issues, 'parking-address-required', 'arrival-access', 'arrivalAccess.parking.address');
  }

  const homeCare = property.homeEssentials.homeCare;
  const hasHomeCare = [
    homeCare.heatingAndCooling,
    homeCare.hotWater,
    homeCare.powerIssues,
    homeCare.waste,
  ].some((value) => !isBlank(value));
  const wifi = property.homeEssentials.wifi;
  const hasWifi =
    wifi !== null &&
    [wifi.networkName, wifi.password, wifi.instructions].some((value) => !isBlank(value));

  if (!hasHomeCare && !hasWifi) {
    addIssue(issues, 'home-essentials-required', 'home-essentials', 'homeEssentials');
  }

  const quietHours = property.houseRules.quietHours;
  if (quietHours !== null) {
    validateTimePair(
      issues,
      'house-rules',
      'houseRules.quietHours',
      quietHours.startTime,
      quietHours.endTime,
      {
        incomplete: 'quiet-hours-incomplete',
        invalid: 'quiet-hours-invalid',
        identical: 'quiet-hours-identical',
        chronological: false,
      },
    );
  }

  property.localGuide.forEach((service, index) => validateNearbyService(service, index, issues));

  if (property.extras.breakfast.kind === 'scheduled') {
    validateTimePair(
      issues,
      'extras',
      'extras.breakfast',
      property.extras.breakfast.startTime,
      property.extras.breakfast.endTime,
      {
        incomplete: 'breakfast-hours-incomplete',
        invalid: 'breakfast-hours-invalid',
        identical: 'breakfast-hours-order',
        chronological: true,
      },
    );
  }

  if (property.checkout.checkoutTime === null || !isTime24(property.checkout.checkoutTime)) {
    addIssue(issues, 'checkout-time-required', 'checkout', 'checkout.checkoutTime');
  }

  return issues;
}

export function calculatePropertyCompletion(property: Property): PropertyCompletion {
  const issues = validateProperty(property);
  const requiredBySection: Readonly<Record<PropertySectionId, readonly string[]>> = {
    overview: [],
    'arrival-access': [],
    'home-essentials': [],
    'house-rules': [],
    'local-guide': property.localGuide.length === 0 ? ['localGuide'] : [],
    extras: [],
    checkout: property.checkout.checklist.length === 0 ? ['checkout.checklist'] : [],
  };

  const sectionIds: readonly PropertySectionId[] = [
    'overview',
    'arrival-access',
    'home-essentials',
    'house-rules',
    'local-guide',
    'extras',
    'checkout',
  ];

  const sections = sectionIds.map((section) => {
    const issuePaths = issues
      .filter((issue) => issue.section === section)
      .map((issue) => issue.path);
    const missingFields = [...new Set([...requiredBySection[section], ...issuePaths])];

    return {
      section,
      complete: missingFields.length === 0,
      missingFields,
    } satisfies PropertySectionCompletion;
  });
  const completedSections = sections.filter((section) => section.complete).length;

  return {
    complete: completedSections === 7,
    completedSections,
    totalSections: 7,
    percentage: Math.round((completedSections / 7) * 100),
    sections,
  };
}

export function markNearbyServiceReviewed<T extends NearbyService>(
  service: T,
  reviewedAt: string,
): T {
  if (Number.isNaN(Date.parse(reviewedAt))) {
    throw new RangeError(`Invalid review timestamp: ${reviewedAt}`);
  }

  return { ...service, lastReviewedAt: reviewedAt };
}
