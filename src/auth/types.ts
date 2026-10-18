/**
 * Account + billing contracts for the sign-up flow.
 *
 * The app only talks to these interfaces. Accounts are backed by Firebase
 * (`firebaseAuthService.ts`; local emulators in development) or, for offline demos,
 * an on-device mock (`mockAuthService.ts`). Billing is still mocked until store
 * products and purchase validation exist.
 */

export type AuthProvider = 'apple' | 'google' | 'email';

export type PlanId = 'free' | 'premium' | 'professional';

export type Account = {
  id: string;
  provider: AuthProvider;
  email: string | null;
  /** What the app calls them; free text. Null until the profile step is finished. */
  displayName: string | null;
  /** The account holder confirmed they're an adult (18+) when setting up the profile. */
  ageConfirmed: boolean;
  /** Legacy unique handle; no longer collected, kept for accounts that have one. */
  username: string | null;
  /** Legacy ISO date (YYYY-MM-DD); no longer collected. */
  birthdate: string | null;
  photoUri: string | null;
  plan: PlanId;
};

/** Longest display name the profile step accepts (the rules enforce the same). */
export const DISPLAY_NAME_MAX_LENGTH = 40;

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
  /** Throws `NotAvailableError` until the provider is set up. */
  signInWithApple(): Promise<SignInResult>;
  signInWithGoogle(): Promise<SignInResult>;
  /** Emails a sign-in ("magic") link and remembers the address on this device. */
  sendSignInLink(email: string): Promise<void>;
  /** True when a URL (e.g. an opened deep link) is a sign-in link. */
  isSignInLink(url: string): boolean;
  /**
   * Signs in with a link from the email. Throws `InvalidLinkError` when it's
   * expired, already used, or was requested on another device.
   */
  completeSignInLink(url: string): Promise<SignInResult>;
  /**
   * Development only: the most recent link "sent" to this address by the local
   * emulator (or mock), so sign-in can be finished without a real inbox.
   */
  devLatestSignInLink?(email: string): Promise<string | null>;
  checkUsername(username: string): Promise<UsernameStatus>;
  /** The profile step: a display name and the adult confirmation. */
  saveProfile(
    accountId: string,
    profile: { displayName: string; ageConfirmed: true; photoUri: string | null },
  ): Promise<Account>;
  /** The signed-in account restored from the device, if any. */
  restoreSession(): Promise<Account | null>;
  signOut(): Promise<void>;
  /**
   * Permanently deletes the signed-in account and its cloud data. Throws
   * `ReauthRequiredError` if the user must sign in again first (nothing is deleted).
   */
  deleteAccount(): Promise<void>;
}

export interface BillingService {
  getPlans(): Promise<Plan[]>;
  /** The plan the user is actually entitled to (store state can override account.plan). */
  planFor(account: Account): Promise<PlanId>;
  /** Starts the store purchase for a plan; resolves with the updated account. */
  purchase(account: Account, planId: Plan['id']): Promise<Account>;
  /** Records the free (Kids Safe Mode) choice. */
  chooseFree(account: Account): Promise<Account>;
}

export class InvalidLinkError extends Error {
  constructor(message = 'That sign-in link has expired or was already used. Request a new one.') {
    super(message);
    this.name = 'InvalidLinkError';
  }
}

export class ReauthRequiredError extends Error {
  constructor() {
    super('For your security, please sign in again, then delete your account.');
    this.name = 'ReauthRequiredError';
  }
}

export class NotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotAvailableError';
  }
}
