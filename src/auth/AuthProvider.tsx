import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Account, AuthService, BillingService, SignInResult } from './types';
import { mockAuthService, mockBillingService } from './mockAuthService';
import { firebaseAuthService } from './firebaseAuthService';
import { authBackend } from '../backend/config';

// Accounts: Firebase (emulators in development) unless EXPO_PUBLIC_AUTH_BACKEND=mock.
const authService: AuthService = authBackend === 'mock' ? mockAuthService : firebaseAuthService;
// Billing stays mocked until store products + server purchase validation exist.
const billingService: BillingService = mockBillingService;

type AuthContextValue = {
  /** Signed-in account, or null when signed out (the app works fully without one). */
  account: Account | null;
  /** False until the saved session has been checked on launch. */
  ready: boolean;
  setAccount: (account: Account | null) => void;
  /** Finishes sign-in from an email link and sets the account. */
  completeSignInLink: (url: string) => Promise<SignInResult>;
  /** Error from a sign-in link that opened the app, for the UI to show. */
  linkError: string | null;
  clearLinkError: () => void;
  signOut: () => Promise<void>;
  /** Set when first-launch onboarding finishes, so the app can offer sign-up once. */
  signupOfferPending: boolean;
  setSignupOfferPending: (pending: boolean) => void;
  auth: AuthService;
  billing: BillingService;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};

/** Applies the billing entitlement on top of the account's stored plan. */
const withPlan = async (account: Account): Promise<Account> => ({
  ...account,
  plan: await billingService.planFor(account),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [signupOfferPending, setSignupOfferPending] = useState(false);

  useEffect(() => {
    authService
      .restoreSession()
      .then(async restored => setAccount(restored ? await withPlan(restored) : null))
      .catch(e => console.warn('Could not restore session:', e))
      .finally(() => setReady(true));
  }, []);

  const completeSignInLink = useCallback(async (url: string) => {
    const result = await authService.completeSignInLink(url);
    const account = await withPlan(result.account);
    setAccount(account);
    return { ...result, account };
  }, []);

  // Sign-in links that open the app (cold start or while running).
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url || !authService.isSignInLink(url)) return;
      completeSignInLink(url).catch(e => setLinkError(e.message ?? 'Sign-in failed.'));
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [completeSignInLink]);

  const signOut = async () => {
    await authService.signOut();
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        account,
        ready,
        setAccount,
        completeSignInLink,
        linkError,
        clearLinkError: () => setLinkError(null),
        signOut,
        signupOfferPending,
        setSignupOfferPending,
        auth: authService,
        billing: billingService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
