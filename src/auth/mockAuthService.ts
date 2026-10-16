/**
 * MOCK BACKEND — nothing here is real.
 *
 * Stand-in for the auth + billing backend so the sign-up flow can be built and
 * demoed. Accounts live only in this device's AsyncStorage; no email is sent,
 * no Apple/Google sign-in happens and nothing is charged.
 *
 * Mock rules (handy when testing):
 * - Any 6-digit code verifies, except 000000, which is rejected.
 * - Usernames in TAKEN_USERNAMES are reported as taken.
 * - Signing in again with the same email (or Apple/Google) finds the earlier
 *   account and skips the profile step if it already has one.
 *
 * Replace with real implementations of AuthService / BillingService.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  AuthProvider,
  AuthService,
  BillingService,
  InvalidCodeError,
  Plan,
  SignInResult,
  UsernameStatus,
} from './types';

const ACCOUNTS_KEY = 'mockAuth.accounts';
const SESSION_KEY = 'mockAuth.sessionAccountId';
const TAKEN_USERNAMES = ['admin', 'whatif', 'riverwalker', 'test'];
const LATENCY_MS = 500;

const delay = (ms = LATENCY_MS) => new Promise(resolve => setTimeout(resolve, ms));

type AccountsByKey = Record<string, Account>;

const loadAccounts = async (): Promise<AccountsByKey> => {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  return raw ? (JSON.parse(raw) as AccountsByKey) : {};
};

const saveAccounts = (accounts: AccountsByKey) =>
  AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

const findById = (accounts: AccountsByKey, id: string) =>
  Object.values(accounts).find(a => a.id === id);

/** Finds or creates the account for a login key and starts a session for it. */
const signIn = async (
  key: string,
  provider: AuthProvider,
  email: string | null,
): Promise<SignInResult> => {
  const accounts = await loadAccounts();
  let account = accounts[key];
  if (!account) {
    account = {
      id: `acct-${Date.now().toString(36)}`,
      provider,
      email,
      username: null,
      birthdate: null,
      photoUri: null,
      plan: 'free',
    };
    accounts[key] = account;
    await saveAccounts(accounts);
  }
  await AsyncStorage.setItem(SESSION_KEY, account.id);
  return { account, needsProfile: !account.username };
};

const updateAccount = async (id: string, patch: Partial<Account>): Promise<Account> => {
  const accounts = await loadAccounts();
  const key = Object.keys(accounts).find(k => accounts[k].id === id);
  if (!key) throw new Error(`Unknown account ${id}`);
  accounts[key] = { ...accounts[key], ...patch };
  await saveAccounts(accounts);
  return accounts[key];
};

export const mockAuthService: AuthService = {
  async signInWithApple() {
    await delay();
    return signIn('apple:mock-user', 'apple', 'apple.user@privaterelay.example');
  },

  async signInWithGoogle() {
    await delay();
    return signIn('google:mock-user', 'google', 'google.user@example.com');
  },

  async sendEmailCode() {
    await delay();
  },

  async verifyEmailCode(email, code) {
    await delay();
    if (!/^\d{6}$/.test(code) || code === '000000') throw new InvalidCodeError();
    const normalized = email.trim().toLowerCase();
    return signIn(`email:${normalized}`, 'email', normalized);
  },

  async checkUsername(username): Promise<UsernameStatus> {
    await delay(300);
    const name = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(name)) return 'invalid';
    if (TAKEN_USERNAMES.includes(name)) return 'taken';
    const accounts = await loadAccounts();
    const session = await AsyncStorage.getItem(SESSION_KEY);
    const usedByOther = Object.values(accounts).some(
      a => a.username?.toLowerCase() === name && a.id !== session,
    );
    return usedByOther ? 'taken' : 'available';
  },

  async saveProfile(accountId, profile) {
    await delay();
    return updateAccount(accountId, profile);
  },

  async restoreSession() {
    const id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return findById(await loadAccounts(), id) ?? null;
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};

// Prices are placeholders until store products exist.
const PLANS: Plan[] = [
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: '$X.XX/month',
    features: [
      'Hundreds of real-world scenario prompts',
      'Parental consent required',
      'Peer pressure, honesty & social media topics',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceLabel: '$X.XX/month',
    tagline: 'For verified educators & therapists',
    features: [
      'Unlimited access to therapeutic prompts',
      'Session & progress tracking',
      'Anonymous group organization',
      'Standards alignment (CASEL, ASCA, IEP)',
    ],
  },
];

export const mockBillingService: BillingService = {
  async getPlans() {
    return PLANS;
  },

  async purchase(accountId, planId) {
    await delay(800);
    return updateAccount(accountId, { plan: planId });
  },

  async chooseFree(accountId) {
    return updateAccount(accountId, { plan: 'free' });
  },
};
