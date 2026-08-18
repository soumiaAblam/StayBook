import { inject, Injectable } from '@angular/core';
import type { StorageFailure } from '../storage';
import {
  type AccountSummary,
  type AuthSession,
  type LocalAccount,
  type RegisterAccountInput,
  type SignInInput,
  toAccountSummary,
} from './auth.models';
import { AuthSessionRepository } from './auth-session.repository';
import {
  isValidNormalizedEmail,
  isValidRegistrationPassword,
  normalizeEmail,
} from './auth-validation';
import { LocalAccountRepository } from './local-account.repository';

export const GENERIC_SIGN_IN_ERROR = 'Unable to sign in with the provided credentials.';

export type RegisterAccountResult =
  | { readonly ok: true; readonly account: AccountSummary }
  | {
      readonly ok: false;
      readonly code: 'account-exists' | 'invalid-registration';
    }
  | { readonly ok: false; readonly code: 'storage-unavailable'; readonly error: StorageFailure };

export type SignInResult =
  | { readonly ok: true; readonly account: AccountSummary; readonly session: AuthSession }
  | {
      readonly ok: false;
      readonly code: 'invalid-credentials';
      readonly message: typeof GENERIC_SIGN_IN_ERROR;
    }
  | { readonly ok: false; readonly code: 'storage-unavailable'; readonly error: StorageFailure };

@Injectable({ providedIn: 'root' })
export class LocalAuthService {
  private readonly accounts = inject(LocalAccountRepository);
  private readonly sessions = inject(AuthSessionRepository);

  async register(input: RegisterAccountInput): Promise<RegisterAccountResult> {
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();

    if (!isValidNormalizedEmail(email) || displayName.length === 0 || !isValidRegistrationPassword(input.password)) {
      return { ok: false, code: 'invalid-registration' };
    }

    const existingAccountResult = this.accounts.findByEmail(email);

    if (!existingAccountResult.ok) {
      return { ok: false, code: 'storage-unavailable', error: existingAccountResult.error };
    }

    if (existingAccountResult.value) {
      return { ok: false, code: 'account-exists' };
    }

    const account: LocalAccount = {
      id: this.createAccountId(),
      email,
      displayName,
      password: input.password,
    };

    const saveResult = this.accounts.add(account);

    if (!saveResult.ok) {
      return { ok: false, code: 'storage-unavailable', error: saveResult.error };
    }

    return { ok: true, account: toAccountSummary(account) };
  }

  async signIn(input: SignInInput): Promise<SignInResult> {
    const email = normalizeEmail(input.email);
    const accountResult = this.accounts.findByEmail(email);

    if (!accountResult.ok) {
      return { ok: false, code: 'storage-unavailable', error: accountResult.error };
    }

    const account = accountResult.value;
    const passwordMatches = Boolean(account && account.password === input.password);

    if (!isValidNormalizedEmail(email) || !account || !passwordMatches) {
      return this.invalidCredentialsResult();
    }

    const sessionResult = this.sessions.start(account.id);

    if (!sessionResult.ok) {
      return { ok: false, code: 'storage-unavailable', error: sessionResult.error };
    }

    return {
      ok: true,
      account: toAccountSummary(account),
      session: sessionResult.value,
    };
  }

  signOut(): ReturnType<AuthSessionRepository['clear']> {
    return this.sessions.clear();
  }

  currentSession(): ReturnType<AuthSessionRepository['read']> {
    return this.sessions.read();
  }

  private invalidCredentialsResult(): SignInResult {
    return {
      ok: false,
      code: 'invalid-credentials',
      message: GENERIC_SIGN_IN_ERROR,
    };
  }

  private createAccountId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `account-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
