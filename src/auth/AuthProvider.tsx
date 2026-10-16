import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Account, AuthService, BillingService } from './types';
import { mockAuthService, mockBillingService } from './mockAuthService';

// Swap these for the real backend implementations when they exist.
const authService: AuthService = mockAuthService;
const billingService: BillingService = mockBillingService;

type AuthContextValue = {
  /** Signed-in account, or null when signed out (the app works fully without one). */
  account: Account | null;
  /** False until the saved session has been checked on launch. */
  ready: boolean;
  setAccount: (account: Account | null) => void;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [signupOfferPending, setSignupOfferPending] = useState(false);

  useEffect(() => {
    authService
      .restoreSession()
      .then(setAccount)
      .finally(() => setReady(true));
  }, []);

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
