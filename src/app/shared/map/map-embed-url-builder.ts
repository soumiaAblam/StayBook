import { Injectable } from '@angular/core';
import {
  areMapCoordinatesValid,
  GoogleMapsExternalUrl,
  MapCoordinates,
  TrustedMapEmbedUrl,
} from './map-location.model';

const GOOGLE_MAPS_EMBED_ORIGIN = 'https://www.google.com';
const GOOGLE_MAPS_EMBED_PATH = '/maps';
const GOOGLE_MAPS_SEARCH_PATH = '/maps/search/';

@Injectable({ providedIn: 'root' })
export class MapEmbedUrlBuilder {
  buildEmbedUrl(coordinates: MapCoordinates): TrustedMapEmbedUrl {
    this.assertCoordinates(coordinates);

    const url = new URL(GOOGLE_MAPS_EMBED_PATH, GOOGLE_MAPS_EMBED_ORIGIN);
    url.searchParams.set('q', this.formatCoordinates(coordinates));
    url.searchParams.set('output', 'embed');

    return url.toString() as TrustedMapEmbedUrl;
  }

  buildExternalUrl(coordinates: MapCoordinates): GoogleMapsExternalUrl {
    this.assertCoordinates(coordinates);

    const url = new URL(GOOGLE_MAPS_SEARCH_PATH, GOOGLE_MAPS_EMBED_ORIGIN);
    url.searchParams.set('api', '1');
    url.searchParams.set('query', this.formatCoordinates(coordinates));

    return url.toString() as GoogleMapsExternalUrl;
  }

  private assertCoordinates(coordinates: MapCoordinates): void {
    if (!areMapCoordinatesValid(coordinates)) {
      throw new RangeError('Map coordinates must be within latitude and longitude ranges.');
    }
  }

  private formatCoordinates(coordinates: MapCoordinates): string {
    return `${this.normalizeNegativeZero(coordinates.latitude)},${this.normalizeNegativeZero(
      coordinates.longitude,
    )}`;
  }

  private normalizeNegativeZero(value: number): number {
    return Object.is(value, -0) ? 0 : value;
  }
}
