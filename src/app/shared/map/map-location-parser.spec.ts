import { TestBed } from '@angular/core/testing';
import { MapLocationParser } from './map-location-parser';

describe('MapLocationParser', () => {
  let parser: MapLocationParser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    parser = TestBed.inject(MapLocationParser);
  });

  it('accepts a plain Google Maps URL and keeps it as the external destination', () => {
    const input = 'https://www.google.com/maps/place/Madrid/@40.416775,-3.70379,15z';
    const result = parser.parse(input);

    expect(result).toEqual({
      ok: true,
      source: 'google-maps-url',
      coordinates: null,
      externalUrl: input,
      embedUrl: input,
    });
  });

  it('accepts a Google Maps short link and derives an embeddable URL', () => {
    const input = 'https://maps.app.goo.gl/zje4hatvhzWc91rAA';
    const result = parser.parse(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected a valid Google Maps short URL.');
    }
    expect(result.externalUrl).toBe(input);
    expect(result.embedUrl).toContain('https://www.google.com/maps');
    expect(result.embedUrl).toContain('output=embed');
  });

  it.each([
    [null, 'empty'],
    ['', 'empty'],
    ['   ', 'empty'],
    ['Madrid, Spain', 'invalid-url'],
    ['javascript:alert(1)', 'https-required'],
    ['http://www.google.com/maps/place/Madrid', 'https-required'],
    ['https://www.google.com/search?q=40,-3', 'unsupported-google-maps-path'],
    ['https://www.example.com/near-the-river', 'unsupported-host'],
  ])('rejects unsafe or unsupported input %#', (input, error) => {
    expect(parser.parse(input)).toEqual({ ok: false, error });
  });

  it('limits input before URL parsing', () => {
    expect(parser.parse(`https://www.google.com/maps?q=${'a'.repeat(2_100)}`)).toEqual({
      ok: false,
      error: 'input-too-long',
    });
  });
});
