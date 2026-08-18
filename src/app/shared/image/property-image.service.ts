import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { PropertyCoverImage } from '../../domain/property';

// Property images are persisted inside browser storage, so we keep both the accepted formats and the final payload size deliberately tight.
export const allowedPropertyImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedPropertyImageType = (typeof allowedPropertyImageTypes)[number];

export const maximumPropertyImageInputBytes = 10 * 1024 * 1024;
export const maximumPropertyImageOutputBytes = 1024 * 1024;
export const maximumPropertyImageDimension = 1_600;

export type PropertyImageFailureCode =
  | 'decode-failed'
  | 'empty-alt-text'
  | 'file-too-large'
  | 'processing-unavailable'
  | 'signature-mismatch'
  | 'unsupported-type';

export class PropertyImageError extends Error {
  constructor(readonly code: PropertyImageFailureCode) {
    super(`Property image processing failed: ${code}`);
  }
}

// We check the real file signature as well as file.type because the browser-reported MIME type is easy to spoof.
export function hasValidImageSignature(
  bytes: Uint8Array,
  mimeType: AllowedPropertyImageType,
): boolean {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((value, index) => bytes[index] === value);
  }

  return (
    bytes.length >= 12 &&
    new TextDecoder('ascii').decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder('ascii').decode(bytes.slice(8, 12)) === 'WEBP'
  );
}

@Injectable({ providedIn: 'root' })
export class PropertyImageService {
  private readonly document = inject(DOCUMENT);

  async process(file: File, altText: string): Promise<PropertyCoverImage> {
    const normalizedAltText = altText.trim();
    if (!normalizedAltText) {
      throw new PropertyImageError('empty-alt-text');
    }

    if (!allowedPropertyImageTypes.includes(file.type as AllowedPropertyImageType)) {
      throw new PropertyImageError('unsupported-type');
    }

    if (file.size === 0 || file.size > maximumPropertyImageInputBytes) {
      throw new PropertyImageError('file-too-large');
    }

    const mimeType = file.type as AllowedPropertyImageType;
    const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!hasValidImageSignature(signature, mimeType)) {
      throw new PropertyImageError('signature-mismatch');
    }

    if (typeof globalThis.createImageBitmap !== 'function') {
      throw new PropertyImageError('processing-unavailable');
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await globalThis.createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      throw new PropertyImageError('decode-failed');
    }

    try {
      const scale = Math.min(
        1,
        maximumPropertyImageDimension / Math.max(bitmap.width, bitmap.height),
      );
      let width = Math.max(1, Math.round(bitmap.width * scale));
      let height = Math.max(1, Math.round(bitmap.height * scale));
      let quality = 0.84;

      // The upload is normalized to a smaller WebP before saving so previews do not exhaust the sessionStorage budget.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const blob = await this.renderWebp(bitmap, width, height, quality);
        if (blob.size <= maximumPropertyImageOutputBytes) {
          return {
            dataUrl: await this.toDataUrl(blob),
            mimeType: 'image/webp',
            altText: normalizedAltText.slice(0, 240),
          };
        }

        width = Math.max(1, Math.round(width * 0.82));
        height = Math.max(1, Math.round(height * 0.82));
        quality = Math.max(0.58, quality - 0.07);
      }

      throw new PropertyImageError('file-too-large');
    } finally {
      bitmap.close();
    }
  }

  // Canvas export gives us one consistent output format no matter which allowed image format the user picked.
  private async renderWebp(
    bitmap: ImageBitmap,
    width: number,
    height: number,
    quality: number,
  ): Promise<Blob> {
    const canvas = this.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new PropertyImageError('processing-unavailable');
    }

    context.drawImage(bitmap, 0, 0, width, height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new PropertyImageError('processing-unavailable'))),
        'image/webp',
        quality,
      );
    });
  }

  private toDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)), { once: true });
      reader.addEventListener(
        'error',
        () => reject(new PropertyImageError('processing-unavailable')),
        { once: true },
      );
      reader.readAsDataURL(blob);
    });
  }
}
