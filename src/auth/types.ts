/**
 * Account + billing contracts for the sign-up flow.
 *
 * The app only talks to these interfaces. Today they're backed by a local mock
 * (`mockAuthService.ts`); a real backend (Supabase/Firebase auth + RevenueCat/IAP)
 * replaces the mock without touching the screens.
 */

export type AuthProvider = 'apple' | 'google' | 'email';

export type PlanId = 'free' | 'premium' | 'professional';

export type Account = {
  id: string;
  provider: AuthProvider;
  email: string | null;
  username: string | null;
  /** ISO date (YYYY-MM-DD). */
  birthdate: string | null;
  photoUri: string | null;
  plan: PlanId;
};

export type SignInResult = {
  account: Account;
  /** True when the account has no profile yet and still needs the profile step. */
  needsProfile: boolean;
};

export type UsernameStatus = 'available' | 'taken' | 'invalid';

export type Plan = {
  id: Exclude<PlanId, 'free'>;
  name: string;
  priceLabel: string;
  tagline?: string;
  features: string[];
};

export interface AuthService {
  signInWithApple(): Promise<SignInResult>;
  signInWithGoogle(): Promise<SignInResult>;
  /** Emails a one-time 6-digit code. */
  sendEmailCode(email: string): Promise<void>;
  /** Throws `InvalidCodeError` when the code is wrong or expired. */
  verifyEmailCode(email: string, code: string): Promise<SignInResult>;
  checkUsername(username: string): Promise<UsernameStatus>;
  saveProfile(
    accountId: string,
    profile: { username: string; birthdate: string; photoUri: string | null },
  ): Promise<Account>;
  /** The signed-in account restored from the device, if any. */
  restoreSession(): Promise<Account | null>;
  signOut(): Promise<void>;
}

export interface BillingService {
  getPlans(): Promise<Plan[]>;
  /** Starts the store purchase for a plan; resolves with the updated account. */
  purchase(accountId: string, planId: Plan['id']): Promise<Account>;
  /** Records the free (Kids Safe Mode) choice. */
  chooseFree(accountId: string): Promise<Account>;
}

export class InvalidCodeError extends Error {
  constructor() {
    super('That code is incorrect or has expired.');
    this.name = 'InvalidCodeError';
  }
}
