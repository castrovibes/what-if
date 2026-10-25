/**
 * Backend configuration from EXPO_PUBLIC_* environment variables (see .env.example).
 *
 * With no real Firebase project configured, development builds use the local
 * emulators under the emulator-only "demo-what-if" project.
 */
import Constants from 'expo-constants';

// Expo only inlines EXPO_PUBLIC_* variables that are referenced literally.
const raw = {
  authBackend: process.env.EXPO_PUBLIC_AUTH_BACKEND,
  useEmulator: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR,
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  emailLinkUrl: process.env.EXPO_PUBLIC_EMAIL_LINK_URL,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

const clean = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

const DEMO_PROJECT_ID = 'demo-what-if';

const realProjectConfigured = !!clean(raw.projectId) && !!clean(raw.apiKey);

export const authBackend: 'firebase' | 'mock' =
  clean(raw.authBackend) === 'mock' ? 'mock' : 'firebase';

export const useEmulator =
  clean(raw.useEmulator) === 'true' || (__DEV__ && !realProjectConfigured && clean(raw.useEmulator) !== 'false');

/** True when there is a Firebase backend to talk to (local emulators or a real project). */
export const firebaseAvailable = useEmulator || realProjectConfigured;

// The emulators run the demo project (`npm run emulators`), so use it whenever they're
// on, even if a real project's keys are also set.
const real: Partial<typeof raw> = useEmulator ? {} : raw;
const projectId = clean(real.projectId) ?? DEMO_PROJECT_ID;

export const firebaseConfig = {
  // The emulators accept any API key.
  apiKey: clean(real.apiKey) ?? 'demo-api-key',
  authDomain: clean(real.authDomain) ?? `${projectId}.firebaseapp.com`,
  projectId,
  appId: clean(real.appId) ?? 'demo-app-id',
};

export const emailLinkUrl =
  clean(raw.emailLinkUrl) ?? `https://${firebaseConfig.authDomain}/finishSignIn`;

/**
 * Google OAuth clients of the Firebase project (each project has its own). Google
 * issues the ID token for the web client, which Firebase Auth accepts. The iOS
 * client's reversed ID is the URL scheme registered in app.json.
 */
export const googleClientIds = {
  web: clean(raw.googleWebClientId),
  ios: clean(raw.googleIosClientId),
};

/**
 * Host running the emulators. The iOS simulator reaches the Mac at localhost; a
 * physical phone uses the dev machine's LAN address from the Expo dev server.
 */
export const emulatorHost = (() => {
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0];
  return host && host !== 'localhost' ? host : '127.0.0.1';
})();

export const EMULATOR_PORTS = { auth: 9099, firestore: 8080 };
