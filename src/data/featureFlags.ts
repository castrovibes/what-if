// Local feature flags for the prototype / beta.

/** "true"/"false" from an EXPO_PUBLIC_* variable, or the default when unset. */
const envFlag = (value: string | undefined, fallback: boolean) =>
  value === 'true' ? true : value === 'false' ? false : fallback;

export const FeatureFlags = {
  // Set to true to act as a Premium user (unlocks Mad Libs builder, etc.).
  // TODO(beta decision): what Premium means for TestFlight testers; replace with the
  // billing entitlement once purchases are real.
  isPremium: true,

  // Set to true to act as a Professional user (unlocks therapeutic features)
  isProfessional: false,

  // "I'm concerned" must not reach testers before clinical review. On in development;
  // off in builds unless EXPO_PUBLIC_SHOW_IM_CONCERNED=true (e.g. an internal-only build).
  showImConcerned: envFlag(process.env.EXPO_PUBLIC_SHOW_IM_CONCERNED, __DEV__),

  // Developer tools (e.g. "Replay First Launch") only in development builds.
  showDevTools: __DEV__,
};
