import { TestBed } from '@angular/core/testing';
import { MapLocationParser } from './map-location-parser';

describe('MapLocationParser', () => {
  let parser: MapLocationParser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    parser = TestBed.inject(MapLocationParser);
  });

  it('parses a latitude,longitude pair and builds both safe destinations', () => {
    const result = parser.parse(' 40.416775, -3.703790 ');

    expect(result).toMatchObject({
      ok: true,
      source: 'coordinates',
      coordinates: { latitude: 40.416775, longitude: -3.70379 },
    });
    if (!result.ok) {
      throw new Error('Expected the coordinate pair to be accepted.');
    }

    expect(new URL(result.externalUrl).origin).toBe('https://www.google.com');
    expect(new URL(result.embedUrl ?? '').searchParams.get('q')).toBe('40.416775,-3.70379');
  });

  it.each([
    ['90,180', { latitude: 90, longitude: 180 }],
    ['-90,-180', { latitude: -90, longitude: -180 }],
    ['+0.5,.25', { latitude: 0.5, longitude: 0.25 }],
  ])('accepts valid coordinate boundary %s', (input, coordinates) => {
    expect(parser.parse(input)).toMatchObject({ ok: true, coordinates });
  });

  it.each(['90.1,0', '-90.1,0', '0,180.1', '0,-180.1', '999,0'])(
    'rejects out-of-range coordinate input %s',
    (input) => {
      expect(parser.parse(input)).toEqual({ ok: false, error: 'coordinates-out-of-range' });
    },
  );

  it('extracts coordinates from a Google Maps viewport path', () => {
    const input = 'https://www.google.com/maps/place/Madrid/@40.416775,-3.70379,15z';
    const result = parser.parse(input);

    expect(result).toMatchObject({
      ok: true,
      source: 'google-maps-url',
      coordinates: { latitude: 40.416775, longitude: -3.70379 },
      externalUrl: input,
    });
  });

  it('prefers exact place data coordinates over viewport coordinates', () => {
    const result = parser.parse(
      'https://www.google.com/maps/place/StayBook/@40,-3,12z/data=!3d41.3874!4d2.1686!5m1',
    );

    expect(result).toMatchObject({
      ok: true,
      coordinates: { latitude: 41.3874, longitude: 2.1686 },
    });
  });

  it.each(['query', 'q', 'll'])(
    'extracts exact coordinates from the known %s query parameter',
    (key) => {
      const result = parser.parse(`https://maps.google.com/?${key}=48.8566%2C2.3522`);

      expect(result).toMatchObject({
        ok: true,
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
      });
    },
  );

  it('returns an external-only fallback for an allowlisted Maps URL without exact coordinates', () => {
    const input = 'https://www.google.com/maps/search/?api=1&query=Retiro+Park';

    expect(parser.parse(input)).toEqual({
      ok: true,
      source: 'google-maps-url',
      coordinates: null,
      externalUrl: input,
      embedUrl: null,
    });
  });

  it('does not infer coordinates from unknown parameters or arbitrary text', () => {
    const result = parser.parse('https://www.google.com/maps?place=40.416775,-3.70379');

    expect(result).toMatchObject({ ok: true, coordinates: null, embedUrl: null });
  });

  it('reconstructs the embed URL without copying untrusted URL parameters', () => {
    const result = parser.parse(
      'https://www.google.com/maps?q=40.416775,-3.70379&output=https://evil.example&callback=alert',
    );
    if (!result.ok || result.embedUrl === null) {
      throw new Error('Expected a reconstructed embed URL.');
    }

    const embedUrl = new URL(result.embedUrl);
    expect(embedUrl.origin).toBe('https://www.google.com');
    expect(embedUrl.pathname).toBe('/maps');
    expect([...embedUrl.searchParams.keys()]).toEqual(['q', 'output']);
    expect(embedUrl.searchParams.get('output')).toBe('embed');
    expect(result.embedUrl).not.toContain('evil.example');
    expect(result.embedUrl).not.toContain('callback');
  });

  it.each([
    [null, 'empty'],
    ['', 'empty'],
    ['Madrid, Spain', 'invalid-url'],
    ['javascript:alert(1)', 'https-required'],
    ['http://www.google.com/maps/@40,-3,10z', 'https-required'],
    ['https://owner:secret@www.google.com/maps/@40,-3,10z', 'credentials-not-allowed'],
    ['https://www.google.com:444/maps/@40,-3,10z', 'unsupported-host'],
    ['https://evil.example/maps/@40,-3,10z', 'unsupported-host'],
    ['https://www.google.com.evil.example/maps/@40,-3,10z', 'unsupported-host'],
    ['https://maps.app.goo.gl/example', 'unsupported-host'],
    ['https://goo.gl/maps/example', 'unsupported-host'],
    ['https://www.google.com/search?q=40,-3', 'unsupported-google-maps-path'],
  ])('rejects unsafe or unsupported input %#', (input, error) => {
    expect(parser.parse(input)).toEqual({ ok: false, error });
  });

  it('rejects path coordinates outside geographic ranges instead of creating an iframe', () => {
    expect(parser.parse('https://www.google.com/maps/@91,-3,10z')).toEqual({
      ok: false,
      error: 'coordinates-out-of-range',
    });
  });

  it('limits input before URL parsing', () => {
    expect(parser.parse(`https://www.google.com/maps?q=${'a'.repeat(2_100)}`)).toEqual({
      ok: false,
      error: 'input-too-long',
    });
  });
});
