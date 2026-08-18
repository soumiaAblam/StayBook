export const supportedLocales = ['es-ES', 'en-GB', 'fr-FR', 'de-DE'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en-GB';
export const localeStorageKey = 'staybook:v1:locale';

export interface LocaleOption {
  readonly locale: SupportedLocale;
  readonly nativeName: string;
  readonly flag: string;
  readonly documentLanguage: string;
}

export const localeOptions: readonly LocaleOption[] = [
  { locale: 'es-ES', nativeName: 'Español', flag: '🇪🇸', documentLanguage: 'es' },
  { locale: 'en-GB', nativeName: 'English', flag: '🇬🇧', documentLanguage: 'en' },
  { locale: 'fr-FR', nativeName: 'Français', flag: '🇫🇷', documentLanguage: 'fr' },
  { locale: 'de-DE', nativeName: 'Deutsch', flag: '🇩🇪', documentLanguage: 'de' },
] as const;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocales.includes(value as SupportedLocale);
}

export function getDocumentLanguage(locale: SupportedLocale): string {
  return localeOptions.find((option) => option.locale === locale)?.documentLanguage ?? 'en';
}
