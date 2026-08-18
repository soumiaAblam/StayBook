import { inject, Injectable } from '@angular/core';
import { MapEmbedUrlBuilder } from './map-embed-url-builder';
import {
  areMapCoordinatesValid,
  GoogleMapsExternalUrl,
  MapCoordinates,
  MapLocationParseError,
  MapLocationParseResult,
} from './map-location.model';

const MAX_INPUT_LENGTH = 2_048;
const NUMBER_TOKEN = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;
const COORDINATE_PAIR_PATTERN = new RegExp(
  String.raw`^\s*(${NUMBER_TOKEN})\s*,\s*(${NUMBER_TOKEN})\s*$`,
);
const PATH_AT_COORDINATES_PATTERN = new RegExp(
  String.raw`(?:^|\/)@(${NUMBER_TOKEN}),(${NUMBER_TOKEN})(?=,|\/|$)`,
);
const PATH_DATA_COORDINATES_PATTERN = new RegExp(
  String.raw`!3d(${NUMBER_TOKEN})!4d(${NUMBER_TOKEN})(?=!|\/|$)`,
  'i',
);

const GOOGLE_MAPS_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com']);
const COORDINATE_QUERY_PARAMETERS = ['query', 'q', 'll'] as const;

type CoordinatePairResult =
  | { readonly status: 'not-coordinates' }
  | { readonly status: 'out-of-range' }
  | { readonly status: 'valid'; readonly coordinates: MapCoordinates };

type CapturedCoordinatePairResult = Exclude<
  CoordinatePairResult,
  { readonly status: 'not-coordinates' }
>;

type UrlCoordinateResult =
  | { readonly status: 'absent' }
  | { readonly status: 'out-of-range' }
  | { readonly status: 'valid'; readonly coordinates: MapCoordinates };

@Injectable({ providedIn: 'root' })
export class MapLocationParser {
  private readonly urlBuilder = inject(MapEmbedUrlBuilder);

  parse(input: unknown): MapLocationParseResult {
    if (typeof input !== 'string' || input.trim().length === 0) {
      return this.failure('empty');
    }

    const normalizedInput = input.trim();
    if (normalizedInput.length > MAX_INPUT_LENGTH) {
      return this.failure('input-too-long');
    }

    const coordinatePair = this.parseCoordinatePair(normalizedInput);
    if (coordinatePair.status === 'valid') {
      return {
        ok: true,
        source: 'coordinates',
        coordinates: coordinatePair.coordinates,
        externalUrl: this.urlBuilder.buildExternalUrl(coordinatePair.coordinates),
        embedUrl: this.urlBuilder.buildEmbedUrl(coordinatePair.coordinates),
      };
    }

    if (coordinatePair.status === 'out-of-range') {
      return this.failure('coordinates-out-of-range');
    }

    return this.parseGoogleMapsUrl(normalizedInput);
  }

  private parseGoogleMapsUrl(input: string): MapLocationParseResult {
    let url: URL;

    try {
      url = new URL(input);
    } catch {
      return this.failure('invalid-url');
    }

    if (url.protocol !== 'https:') {
      return this.failure('https-required');
    }

    if (url.username.length > 0 || url.password.length > 0) {
      return this.failure('credentials-not-allowed');
    }

    if (url.port.length > 0 || !GOOGLE_MAPS_HOSTS.has(url.hostname.toLowerCase())) {
      return this.failure('unsupported-host');
    }

    if (!this.isGoogleMapsPath(url)) {
      return this.failure('unsupported-google-maps-path');
    }

    const coordinates = this.extractUrlCoordinates(url);
    if (coordinates.status === 'out-of-range') {
      return this.failure('coordinates-out-of-range');
    }

    const externalUrl = url.toString() as GoogleMapsExternalUrl;
    if (coordinates.status === 'absent') {
      return {
        ok: true,
        source: 'google-maps-url',
        coordinates: null,
        externalUrl,
        embedUrl: null,
      };
    }

    return {
      ok: true,
      source: 'google-maps-url',
      coordinates: coordinates.coordinates,
      externalUrl,
      embedUrl: this.urlBuilder.buildEmbedUrl(coordinates.coordinates),
    };
  }

  private isGoogleMapsPath(url: URL): boolean {
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'maps.google.com') {
      return url.pathname === '/' || url.pathname === '/maps' || url.pathname.startsWith('/maps/');
    }

    return url.pathname === '/maps' || url.pathname.startsWith('/maps/');
  }

  private extractUrlCoordinates(url: URL): UrlCoordinateResult {
    for (const parameter of COORDINATE_QUERY_PARAMETERS) {
      const value = url.searchParams.get(parameter);
      if (value === null) {
        continue;
      }

      const queryCoordinates = this.parseCoordinatePair(value);
      if (queryCoordinates.status === 'valid') {
        return queryCoordinates;
      }

      if (queryCoordinates.status === 'out-of-range') {
        return queryCoordinates;
      }
    }

    const dataMatch = PATH_DATA_COORDINATES_PATTERN.exec(url.pathname);
    if (dataMatch) {
      return this.parseCapturedCoordinates(dataMatch[1], dataMatch[2]);
    }

    const atMatch = PATH_AT_COORDINATES_PATTERN.exec(url.pathname);
    if (atMatch) {
      return this.parseCapturedCoordinates(atMatch[1], atMatch[2]);
    }

    return { status: 'absent' };
  }

  private parseCoordinatePair(value: string): CoordinatePairResult {
    const match = COORDINATE_PAIR_PATTERN.exec(value);
    return match
      ? this.parseCapturedCoordinates(match[1], match[2])
      : { status: 'not-coordinates' };
  }

  private parseCapturedCoordinates(
    latitudeValue: string,
    longitudeValue: string,
  ): CapturedCoordinatePairResult {
    const coordinates: MapCoordinates = {
      latitude: this.normalizeNegativeZero(Number(latitudeValue)),
      longitude: this.normalizeNegativeZero(Number(longitudeValue)),
    };

    return areMapCoordinatesValid(coordinates)
      ? { status: 'valid', coordinates }
      : { status: 'out-of-range' };
  }

  private normalizeNegativeZero(value: number): number {
    return Object.is(value, -0) ? 0 : value;
  }

  private failure(error: MapLocationParseError): MapLocationParseResult {
    return { ok: false, error };
  }
}
