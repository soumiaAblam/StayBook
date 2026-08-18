import { Injectable } from '@angular/core';
import { GoogleMapsExternalUrl, MapLocationParseError, MapLocationParseResult, TrustedMapEmbedUrl } from './map-location.model';

const MAX_INPUT_LENGTH = 2_048;
const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
]);

@Injectable({ providedIn: 'root' })
export class MapLocationParser {
  parse(input: unknown): MapLocationParseResult {
    if (typeof input !== 'string' || input.trim().length === 0) {
      return this.failure('empty');
    }

    const normalizedInput = input.trim();
    if (normalizedInput.length > MAX_INPUT_LENGTH) {
      return this.failure('input-too-long');
    }

    try {
      const url = new URL(normalizedInput);
      if (url.protocol !== 'https:') {
        return this.failure('https-required');
      }

      if (url.username.length > 0 || url.password.length > 0) {
        return this.failure('credentials-not-allowed');
      }

      if (url.port.length > 0 || !this.isGoogleMapsHost(url.hostname)) {
        return this.failure('unsupported-host');
      }

      if (this.isShortGoogleMapsLink(url)) {
        return {
          ok: true,
          source: 'google-maps-url',
          coordinates: null,
          externalUrl: normalizedInput as GoogleMapsExternalUrl,
          embedUrl: this.buildEmbedFallback(url),
        };
      }

      if (!this.isGoogleMapsPath(url.pathname)) {
        return this.failure('unsupported-google-maps-path');
      }

      return {
        ok: true,
        source: 'google-maps-url',
        coordinates: null,
        externalUrl: normalizedInput as GoogleMapsExternalUrl,
        embedUrl: normalizedInput as TrustedMapEmbedUrl,
      };
    } catch {
      return this.failure('invalid-url');
    }
  }

  private isGoogleMapsHost(hostname: string): boolean {
    const normalizedHost = hostname.toLowerCase();
    return GOOGLE_MAPS_HOSTS.has(normalizedHost);
  }

  private isShortGoogleMapsLink(url: URL): boolean {
    return url.hostname.toLowerCase() === 'maps.app.goo.gl';
  }

  private buildEmbedFallback(url: URL): TrustedMapEmbedUrl {
    const base = new URL('https://www.google.com/maps');
    const fallbackQuery = url.searchParams.get('q') ?? url.pathname.replace(/^\/+/, '');
    base.searchParams.set('q', fallbackQuery || 'Google Maps location');
    base.searchParams.set('output', 'embed');
    return base.toString() as TrustedMapEmbedUrl;
  }

  private isGoogleMapsPath(pathname: string): boolean {
    return pathname === '/maps' || pathname.startsWith('/maps/');
  }

  private failure(error: MapLocationParseError): MapLocationParseResult {
    return { ok: false, error };
  }
}
