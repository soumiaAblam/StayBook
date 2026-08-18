declare const trustedMapEmbedUrlBrand: unique symbol;
declare const googleMapsExternalUrlBrand: unique symbol;

/**
 * A Google Maps embed URL assembled by {@link MapEmbedUrlBuilder} from validated
 * numeric coordinates. It is never an Owner-provided resource URL.
 */
export type TrustedMapEmbedUrl = string & {
  readonly [trustedMapEmbedUrlBrand]: 'TrustedMapEmbedUrl';
};

/** An absolute HTTPS URL whose Google Maps origin and path were allowlisted. */
export type GoogleMapsExternalUrl = string & {
  readonly [googleMapsExternalUrlBrand]: 'GoogleMapsExternalUrl';
};

export interface MapCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export type MapLocationSource = 'coordinates' | 'google-maps-url';

export interface ParsedMapLocation {
  readonly source: MapLocationSource;
  readonly coordinates: MapCoordinates | null;
  readonly externalUrl: GoogleMapsExternalUrl;
  readonly embedUrl: TrustedMapEmbedUrl | null;
}

export type MapLocationParseError =
  | 'empty'
  | 'input-too-long'
  | 'invalid-url'
  | 'https-required'
  | 'credentials-not-allowed'
  | 'unsupported-host'
  | 'unsupported-google-maps-path'
  | 'coordinates-out-of-range'
  | 'unsupported-format';

export type MapLocationParseResult =
  | ({ readonly ok: true } & ParsedMapLocation)
  | {
      readonly ok: false;
      readonly error: MapLocationParseError;
    };

export function areMapCoordinatesValid(coordinates: MapCoordinates): boolean {
  return (
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}
