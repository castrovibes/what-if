// Local feature flags for the prototype / beta.

/** "true"/"false" from an EXPO_PUBLIC_* variable, or the default when unset. */
const envFlag = (value: string | undefined, fallback: boolean) =>
  value === 'true' ? true : value === 'false' ? false : fallback;

// Beta decision: plans are free during the beta, so every tester gets Premium.
// Set EXPO_PUBLIC_BETA_FREE_ACCESS=false once real purchases exist.
const betaFreeAccess = envFlag(process.env.EXPO_PUBLIC_BETA_FREE_ACCESS, true);

export const FeatureFlags = {
  /** Plans are shown as "Free during beta" and everyone gets Premium. */
  betaFreeAccess,

  // Acts as a Premium user (unlocks Mad Libs builder, Premium prompts, etc.).
  // TODO: replace with the billing entitlement once purchases are real.
  isPremium: betaFreeAccess,

  // Set to true to act as a Professional user (unlocks therapeutic features)
  isProfessional: false,

  // "I'm concerned" must not reach testers before clinical review. On in development;
  // off in builds unless EXPO_PUBLIC_SHOW_IM_CONCERNED=true (e.g. an internal-only build).
  showImConcerned: envFlag(process.env.EXPO_PUBLIC_SHOW_IM_CONCERNED, __DEV__),

  // Sign-up stays hidden from testers until the real Firebase project is live.
  // On in development; set EXPO_PUBLIC_ENABLE_SIGNUP=true to turn it on in builds.
  showSignup: envFlag(process.env.EXPO_PUBLIC_ENABLE_SIGNUP, __DEV__),

  // Developer tools (e.g. "Replay First Launch") only in development builds.
  showDevTools: __DEV__,
};
