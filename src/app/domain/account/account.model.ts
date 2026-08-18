export type AccountId = string;

export type SupportedLocale = 'de-DE' | 'en-GB' | 'es-ES' | 'fr-FR';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  'es-ES',
  'en-GB',
  'fr-FR',
  'de-DE',
] as const;

export interface LocalAccount {
  readonly id: AccountId;
  readonly email: string;
  readonly normalizedEmail: string;
  readonly registrationDisplayName: string;
  readonly password: string;
}

export interface AuthSession {
  readonly accountId: AccountId;
  readonly authenticatedAt: string;
}

export interface OwnerProfile {
  readonly accountId: AccountId;
  readonly displayName: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly photoDataUrl: string | null;
}
