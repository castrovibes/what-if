/**
 * MOCK BACKENDS — nothing here is real.
 *
 * - mockAuthService: on-device accounts for offline demos (EXPO_PUBLIC_AUTH_BACKEND=mock).
 *   No email is sent; the "sign-in link" is fetched with the dev button on the
 *   Check Email screen. Apple/Google sign-in are simulated.
 * - mockBillingService: used with every auth backend until store products and server
 *   purchase validation exist. Nothing is charged; the chosen plan is remembered on
 *   this device only.
 *
 * Mock rules (handy when testing):
 * - Usernames in TAKEN_USERNAMES are reported as taken.
 * - Signing in again with the same email (or Apple/Google) finds the earlier
 *   account and skips the profile step if it already has one.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  AuthProvider,
  AuthService,
  BillingService,
  InvalidLinkError,
  Plan,
  PlanId,
  SignInResult,
  UsernameStatus,
} from './types';

const ACCOUNTS_KEY = 'mockAuth.accounts';
const SESSION_KEY = 'mockAuth.sessionAccountId';
const PENDING_EMAIL_KEY = 'mockAuth.pendingEmail';
const PLAN_KEY = (accountId: string) => `mockBilling.plan.${accountId}`;
const MOCK_LINK_PREFIX = 'whatif-mock://signin?email=';
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
      displayName: null,
      ageConfirmed: false,
      username: null,
      birthdate: null,
      photoUri: null,
      plan: 'free',
    };
    accounts[key] = account;
    await saveAccounts(accounts);
  }
  await AsyncStorage.setItem(SESSION_KEY, account.id);
  return { account, needsProfile: !account.displayName };
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

  async sendSignInLink(email) {
    await delay();
    await AsyncStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase());
  },

  isSignInLink(url) {
    return url.startsWith(MOCK_LINK_PREFIX);
  },

  async completeSignInLink(url) {
    await delay();
    const email = decodeURIComponent(url.slice(MOCK_LINK_PREFIX.length));
    const pending = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
    if (!email || email !== pending) throw new InvalidLinkError();
    await AsyncStorage.removeItem(PENDING_EMAIL_KEY);
    return signIn(`email:${email}`, 'email', email);
  },

  async devLatestSignInLink(email) {
    const pending = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
    const normalized = email.trim().toLowerCase();
    return pending === normalized ? MOCK_LINK_PREFIX + encodeURIComponent(normalized) : null;
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
    return updateAccount(accountId, {
      displayName: profile.displayName.trim(),
      ageConfirmed: profile.ageConfirmed,
      photoUri: profile.photoUri,
    });
  },

  async restoreSession() {
    const id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return findById(await loadAccounts(), id) ?? null;
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async deleteAccount() {
    const id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) return;
    const accounts = await loadAccounts();
    for (const key of Object.keys(accounts)) if (accounts[key].id === id) delete accounts[key];
    await saveAccounts(accounts);
    await AsyncStorage.multiRemove([SESSION_KEY, PLAN_KEY(id)]);
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

  async planFor(account) {
    const stored = await AsyncStorage.getItem(PLAN_KEY(account.id));
    return (stored as PlanId | null) ?? account.plan;
  },

  async purchase(account, planId) {
    await delay(800);
    await AsyncStorage.setItem(PLAN_KEY(account.id), planId);
    return { ...account, plan: planId };
  },

  async chooseFree(account) {
    await AsyncStorage.setItem(PLAN_KEY(account.id), 'free');
    return { ...account, plan: 'free' };
  },
};
