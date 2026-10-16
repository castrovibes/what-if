/**
 * Syncs account-level preferences (users/{uid}.preferences): dark mode and the
 * active context. (The preferred age range lives on the context, which syncs with
 * the other user data.)
 *
 * Preferences are small and last-write-wins, so they're written directly rather than
 * through the outbox; a write that fails offline is simply retried on the next change
 * or the next sign-in.
 */
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirebase } from '../backend/firebase';
import { UserDoc, UserPreferences, paths } from '../backend/model';
import { authBackend } from '../backend/config';

let currentUid: string | null = null;

export const PreferenceSync = {
  setUser(uid: string | null) {
    currentUid = authBackend === 'firebase' ? uid : null;
  },

  /** Saves changed preferences to the signed-in account. A no-op when signed out. */
  async push(patch: Partial<UserPreferences>) {
    const uid = currentUid;
    if (!uid) return;
    const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
    for (const [key, value] of Object.entries(patch)) data[`preferences.${key}`] = value;
    try {
      await updateDoc(doc(getFirebase().db, paths.user(uid)), data);
    } catch (e) {
      console.warn('Could not save preferences:', e);
    }
  },

  /** The signed-in account's saved preferences, or null when signed out/unavailable. */
  async fetch(): Promise<UserPreferences | null> {
    const uid = currentUid;
    if (!uid) return null;
    try {
      const snap = await getDoc(doc(getFirebase().db, paths.user(uid)));
      return (snap.data() as UserDoc | undefined)?.preferences ?? null;
    } catch (e) {
      console.warn('Could not load preferences:', e);
      return null;
    }
  },
};
