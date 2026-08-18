import type { AccountId } from '../../domain/account';
import type { CheckoutItem, Property, PropertyId } from '../../domain/property';

export const DEFAULT_CHECKOUT_ITEMS: readonly CheckoutItem[] = [
  {
    id: 'default-lock-up',
    label: 'Lock up as instructed by your host',
    isDefault: true,
  },
  {
    id: 'default-rubbish',
    label: 'Place rubbish in the designated area',
    isDefault: true,
  },
  {
    id: 'default-towels',
    label: 'Leave used towels where instructed',
    isDefault: true,
  },
  {
    id: 'default-belongings',
    label: 'Take all personal belongings with you',
    isDefault: true,
  },
] as const;

export interface CreateDefaultPropertyInput {
  readonly id: PropertyId;
  readonly ownerAccountId: AccountId;
  readonly now?: Date;
}

export function createDefaultProperty({
  id,
  ownerAccountId,
  now = new Date(),
}: CreateDefaultPropertyInput): Property {
  const timestamp = now.toISOString();

  return {
    schemaVersion: 1,
    id,
    ownerAccountId,
    overview: {
      name: '',
      cityOrArea: '',
      propertyType: 'apartment',
      welcomeMessage: '',
      coverImage: null,
    },
    arrivalAccess: {
      checkInTime: null,
      checkInInstructions: '',
      location: {
        writtenAddress: '',
        mapReference: '',
        directions: '',
      },
      homeAccess: {
        method: 'door',
        instructions: '',
        doorCode: '',
        lockboxCode: '',
      },
      parking: { kind: 'none' },
      luggage: { kind: 'none' },
    },
    homeEssentials: {
      wifi: null,
      homeCare: {
        heatingAndCooling: '',
        hotWater: '',
        powerIssues: '',
        waste: '',
      },
    },
    houseRules: {
      quietHours: null,
      smoking: 'not-allowed',
      events: 'not-allowed',
      pets: 'ask-host',
      babies: 'allowed',
      children: 'allowed',
      visitors: 'ask-host',
      additionalNote: '',
    },
    localGuide: [],
    extras: {
      breakfast: { kind: 'unavailable' },
      lateCheckout: { available: false, instructions: '' },
      familyEquipment: { available: false, instructions: '' },
      petStay: { available: false, instructions: '' },
      specialRequests: '',
    },
    checkout: {
      checkoutTime: null,
      keyReturn: '',
      rubbish: '',
      departureNote: '',
      checklist: DEFAULT_CHECKOUT_ITEMS.map((item) => ({ ...item })),
    },
    hostSupport: {
      name: '',
      phone: '',
      email: '',
      photoDataUrl: null,
    },
    internalNotes: '',
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}
