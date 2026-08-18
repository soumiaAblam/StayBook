import { InjectionToken } from '@angular/core';

function resolveBrowserStorage(storageName: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window[storageName];
  } catch {
    return null;
  }
}

export const LOCAL_STORAGE = new InjectionToken<Storage | null>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => resolveBrowserStorage('localStorage'),
});

export const SESSION_STORAGE = new InjectionToken<Storage | null>('SESSION_STORAGE', {
  providedIn: 'root',
  factory: () => resolveBrowserStorage('sessionStorage'),
});
