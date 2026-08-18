import { hasValidImageSignature } from './property-image.service';

describe('property image validation', () => {
  it('accepts only matching JPEG, PNG and WebP magic bytes', () => {
    expect(hasValidImageSignature(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg')).toBe(true);
    expect(
      hasValidImageSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/png',
      ),
    ).toBe(true);
    expect(
      hasValidImageSignature(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
        'image/webp',
      ),
    ).toBe(true);
    expect(hasValidImageSignature(new Uint8Array([0x3c, 0x73, 0x76, 0x67]), 'image/png')).toBe(
      false,
    );
  });
});
