/**
 * Firebase app, Auth and Firestore instances (created once, on first use).
 * In development they point at the local emulators; see config.ts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { EMULATOR_PORTS, emulatorHost, firebaseConfig, useEmulator } from './config';

type FirebaseHandles = { app: FirebaseApp; auth: Auth; db: Firestore };

let handles: FirebaseHandles | null = null;

export const getFirebase = (): FirebaseHandles => {
  if (handles) return handles;

  const existing = getApps().length > 0;
  const app = existing ? getApp() : initializeApp(firebaseConfig);
  // Keep the signed-in session across app launches.
  const auth = existing
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  const db = getFirestore(app);

  if (useEmulator && !existing) {
    connectAuthEmulator(auth, `http://${emulatorHost}:${EMULATOR_PORTS.auth}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, emulatorHost, EMULATOR_PORTS.firestore);
  }

  handles = { app, auth, db };
  return handles;
};
