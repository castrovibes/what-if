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
};

const clean =(v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

const DEMO_PROJECT_ID = 'demo-what-if';

const realProjectConfigured = !!clean(raw.projectId) && !!clean(raw.apiKey);

export const authBackend: 'firebase' | 'mock' =
  clean(raw.authBackend) === 'mock' ? 'mock' : 'firebase';

export const useEmulator =
  clean(raw.useEmulator) === 'true' || (__DEV__ && !realProjectConfigured && clean(raw.useEmulator) !== 'false');

/** True when there is a Firebase backend to talk to (local emulators or a real project). */
export const firebaseAvailable = useEmulator || realProjectConfigured;

const projectId = clean(raw.projectId) ?? DEMO_PROJECT_ID;

export const firebaseConfig = {
  // The emulators accept any API key.
  apiKey: clean(raw.apiKey) ?? 'demo-api-key',
  authDomain: clean(raw.authDomain) ?? `${projectId}.firebaseapp.com`,
  projectId,
  appId: clean(raw.appId) ?? 'demo-app-id',
};

export const emailLinkUrl =
  clean(raw.emailLinkUrl) ?? `https://${firebaseConfig.authDomain}/finishSignIn`;

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
