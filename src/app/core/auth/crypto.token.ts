import { InjectionToken } from '@angular/core';

function resolveWebCrypto(): Crypto | null {
  const cryptoProvider = globalThis.crypto;

  return cryptoProvider?.subtle ? cryptoProvider : null;
}

export const WEB_CRYPTO = new InjectionToken<Crypto | null>('WEB_CRYPTO', {
  providedIn: 'root',
  factory: resolveWebCrypto,
});
