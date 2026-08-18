import { arrayOf, hasExactlyKeys, isRecord } from '../storage';
import type { AuthSession, LocalAccount } from './auth.models';

export interface LocalAccountCollection {
  readonly accounts: readonly LocalAccount[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidNormalizedEmail(value: unknown): value is string {
  return typeof value === 'string' && value === normalizeEmail(value) && value.includes('@');
}

export function isValidAccountId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !value.includes(' ');
}

export function isLocalAccount(value: unknown): value is LocalAccount {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['id', 'email', 'displayName', 'password']) &&
    isValidAccountId(value['id']) &&
    isValidNormalizedEmail(value['email']) &&
    typeof value['displayName'] === 'string' &&
    value['displayName'].trim().length > 0 &&
    typeof value['password'] === 'string' &&
    value['password'].length > 0
  );
}

export function isLocalAccountCollection(value: unknown): value is LocalAccountCollection {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['accounts']) &&
    arrayOf(isLocalAccount, 100)(value['accounts'])
  );
}

export function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['accountId', 'authenticatedAt']) &&
    isValidAccountId(value['accountId']) &&
    typeof value['authenticatedAt'] === 'string' &&
    value['authenticatedAt'].length > 0
  );
}

export function isValidRegistrationPassword(password: string): boolean {
  return password.length > 0;
}
