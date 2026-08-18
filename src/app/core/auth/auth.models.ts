export interface LocalAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}

export interface AccountSummary {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface AuthSession {
  readonly accountId: string;
  readonly authenticatedAt: string;
}

export interface RegisterAccountInput {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

export function toAccountSummary(account: LocalAccount): AccountSummary {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}
