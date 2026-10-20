/**
 * AuthService backed by Firebase Auth (email sign-in links) and Firestore (the
 * users/{uid} account document). Data model and rules: src/backend/model.ts and
 * firebase/firestore.rules.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  deleteUser,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { getFirebase } from '../backend/firebase';
import { EMULATOR_PORTS, emailLinkUrl, emulatorHost, firebaseConfig, useEmulator } from '../backend/config';
import { SCHEMA_VERSION, USERNAME_PATTERN, USER_COLLECTIONS, UserDoc, paths } from '../backend/model';
import {
  Account,
  AuthProvider,
  AuthService,
  InvalidLinkError,
  NotAvailableError,
  ReauthRequiredError,
  SignInResult,
  UsernameStatus,
} from './types';

const EMAIL_FOR_SIGN_IN_KEY = 'auth.emailForSignIn';
const BUNDLE_ID = 'com.whatcouldyoudo.app';

const providerOf = (user: User): AuthProvider => {
  const id = user.providerData[0]?.providerId;
  if (id === 'apple.com') return 'apple';
  if (id === 'google.com') return 'google';
  return 'email';
};

const toAccount = (uid: string, data: UserDoc): Account => ({
  id: uid,
  provider: data.authProvider,
  email: data.email,
  // Accounts from before the display-name profile step may only have a username.
  displayName: data.displayName ?? data.username ?? null,
  ageConfirmed: data.ageConfirmedAt != null || data.birthdate != null,
  username: data.username,
  birthdate: data.birthdate,
  photoUri: data.photoUrl,
  plan: data.plan,
});

const hasProfile = (data: UserDoc) => !!(data.displayName ?? data.username);

/** Loads the user's account document, creating it on first sign-in. */
const ensureUserDoc = async (user: User): Promise<SignInResult> => {
  const { db } = getFirebase();
  const ref = doc(db, paths.user(user.uid));
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      schemaVersion: SCHEMA_VERSION,
      displayName: null,
      ageConfirmedAt: null,
      username: null,
      usernameLower: null,
      email: user.email ?? null,
      authProvider: providerOf(user),
      birthdate: null,
      photoUrl: null,
      plan: 'free',
      preferences: { darkMode: null, activeContextId: null, communityFilter: null },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  const data = (await getDoc(ref)).data() as UserDoc;
  return { account: toAccount(user.uid, data), needsProfile: !hasProfile(data) };
};

// Firebase only lets a sign-in be deleted shortly after signing in.
const RECENT_SIGN_IN_MS = 5 * 60 * 1000;
const FIRESTORE_BATCH_LIMIT = 450;

const isLinkError = (e: unknown) =>
  e instanceof FirebaseError &&
  ['auth/invalid-action-code', 'auth/expired-action-code', 'auth/invalid-email'].includes(e.code);

export const firebaseAuthService: AuthService = {
  // TODO: needs the Apple Developer "Sign in with Apple" capability + expo-apple-authentication.
  async signInWithApple() {
    throw new NotAvailableError('Sign in with Apple is coming soon. Please continue with email for now.');
  },

  // TODO: needs Google OAuth client IDs + a native Google sign-in module.
  async signInWithGoogle() {
    throw new NotAvailableError('Sign in with Google is coming soon. Please continue with email for now.');
  },

  async sendSignInLink(email) {
    const { auth } = getFirebase();
    const address = email.trim();
    await sendSignInLinkToEmail(auth, address, {
      url: emailLinkUrl,
      handleCodeInApp: true,
      iOS: { bundleId: BUNDLE_ID },
      android: { packageName: BUNDLE_ID, installApp: true },
    });
    // Firebase needs the same address to finish sign-in when the link is opened.
    await AsyncStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, address);
  },

  isSignInLink(url) {
    return isSignInWithEmailLink(getFirebase().auth, url);
  },

  async completeSignInLink(url) {
    const { auth } = getFirebase();
    const email = await AsyncStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
    if (!email) {
      throw new InvalidLinkError(
        'Open the link on the same phone where you asked for it, or request a new one.',
      );
    }
    try {
      const { user } = await signInWithEmailLink(auth, email, url);
      await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      return await ensureUserDoc(user);
    } catch (e) {
      if (isLinkError(e)) throw new InvalidLinkError();
      throw e;
    }
  },

  // The Auth emulator doesn't send email; it exposes "sent" links over REST.
  async devLatestSignInLink(email) {
    if (!useEmulator) return null;
    const res = await fetch(
      `http://${emulatorHost}:${EMULATOR_PORTS.auth}/emulator/v1/projects/${firebaseConfig.projectId}/oobCodes`,
    );
    const body = (await res.json()) as {
      oobCodes?: { email: string; requestType: string; oobLink: string }[];
    };
    const wanted = email.trim().toLowerCase();
    const links = (body.oobCodes ?? []).filter(
      c => c.requestType === 'EMAIL_SIGNIN' && c.email.toLowerCase() === wanted,
    );
    return links.length > 0 ? links[links.length - 1].oobLink : null;
  },

  async checkUsername(username): Promise<UsernameStatus> {
    const lower = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(lower)) return 'invalid';
    const { db, auth } = getFirebase();
    const snap = await getDoc(doc(db, paths.username(lower)));
    if (!snap.exists()) return 'available';
    return snap.data().uid === auth.currentUser?.uid ? 'available' : 'taken';
  },

  async saveProfile(uid, profile) {
    const { db } = getFirebase();
    const userRef = doc(db, paths.user(uid));
    const current = (await getDoc(userRef)).data() as UserDoc;
    await updateDoc(userRef, {
      displayName: profile.displayName.trim(),
      // Set once; the rules keep it a timestamp afterwards.
      ageConfirmedAt: current.ageConfirmedAt ?? serverTimestamp(),
      // TODO: upload the photo to Storage and save its URL here.
      updatedAt: serverTimestamp(),
    });
    const saved = (await getDoc(userRef)).data() as UserDoc;
    return toAccount(uid, saved);
  },

  async restoreSession() {
    const { auth } = getFirebase();
    await auth.authStateReady();
    if (!auth.currentUser) return null;
    return (await ensureUserDoc(auth.currentUser)).account;
  },

  async signOut() {
    await firebaseSignOut(getFirebase().auth);
  },

  async deleteAccount() {
    const { auth, db } = getFirebase();
    const user = auth.currentUser;
    if (!user) return;
    // Check first, so we never delete the data but leave the sign-in behind.
    const lastSignIn = Date.parse(user.metadata.lastSignInTime ?? '');
    if (!lastSignIn || Date.now() - lastSignIn > RECENT_SIGN_IN_MS) {
      throw new ReauthRequiredError();
    }

    // 1. The user's synced data.
    for (const coll of USER_COLLECTIONS) {
      const snap = await getDocs(collection(db, paths.userCollection(user.uid, coll)));
      for (let i = 0; i < snap.docs.length; i += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + FIRESTORE_BATCH_LIMIT).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    // 2. The account and its username claim, together (the rules check them as a pair).
    const userRef = doc(db, paths.user(user.uid));
    const data = (await getDoc(userRef)).data() as UserDoc | undefined;
    const batch = writeBatch(db);
    if (data?.usernameLower) batch.delete(doc(db, paths.username(data.usernameLower)));
    batch.delete(userRef);
    await batch.commit();
    // 3. The sign-in itself.
    try {
      await deleteUser(user);
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/requires-recent-login') {
        throw new ReauthRequiredError();
      }
      throw e;
    }
    await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  },
};
