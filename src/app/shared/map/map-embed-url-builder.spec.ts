import { MapEmbedUrlBuilder } from './map-embed-url-builder';

describe('MapEmbedUrlBuilder', () => {
  const builder = new MapEmbedUrlBuilder();

  it('builds a fixed allowlisted embed URL from validated coordinates', () => {
    const embedUrl = new URL(builder.buildEmbedUrl({ latitude: 40.416775, longitude: -3.70379 }));

    expect(embedUrl.origin).toBe('https://www.google.com');
    expect(embedUrl.pathname).toBe('/maps');
    expect(embedUrl.searchParams.get('q')).toBe('40.416775,-3.70379');
    expect(embedUrl.searchParams.get('output')).toBe('embed');
  });

  it('builds a Google Maps external search URL for coordinate-only input', () => {
    const externalUrl = new URL(builder.buildExternalUrl({ latitude: 48.8566, longitude: 2.3522 }));

    expect(externalUrl.origin).toBe('https://www.google.com');
    expect(externalUrl.pathname).toBe('/maps/search/');
    expect(externalUrl.searchParams.get('api')).toBe('1');
    expect(externalUrl.searchParams.get('query')).toBe('48.8566,2.3522');
  });

  it('normalizes negative zero instead of leaking an unusual coordinate representation', () => {
    const embedUrl = new URL(builder.buildEmbedUrl({ latitude: -0, longitude: -0 }));

    expect(embedUrl.searchParams.get('q')).toBe('0,0');
  });

  it.each([
    { latitude: 90.000001, longitude: 0 },
    { latitude: 0, longitude: -180.000001 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
  ])('refuses invalid runtime coordinates: %j', (coordinates) => {
    expect(() => builder.buildEmbedUrl(coordinates)).toThrow(RangeError);
    expect(() => builder.buildExternalUrl(coordinates)).toThrow(RangeError);
  });
});
