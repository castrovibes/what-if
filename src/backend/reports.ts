/**
 * Prompt reports from the flag icon, saved to Firestore `reports/{id}` for the team to
 * review in the Firebase console. Anonymous: no personal data, only the account id if
 * signed in. Rules: firebase/firestore.rules.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebase } from './firebase';
import { firebaseAvailable } from './config';

export type ReportReason = 'inappropriate' | 'wrong-age' | 'confusing' | 'other';

export type ReportResult = 'sent' | 'queued' | 'unavailable';

const ACK_TIMEOUT_MS = 6000;

/**
 * Files a report. 'queued' means it's waiting for a connection (Firestore sends it
 * when back online while the app is open); 'unavailable' means there's no backend.
 */
export const submitPromptReport = async (
  promptId: string,
  reason: ReportReason,
): Promise<ReportResult> => {
  if (!firebaseAvailable) return 'unavailable';
  const { db, auth } = getFirebase();
  const write = addDoc(collection(db, 'reports'), {
    promptId,
    reason,
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    uid: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  }).then(() => 'sent' as const);
  const timeout = new Promise<'queued'>(resolve =>
    setTimeout(() => resolve('queued'), ACK_TIMEOUT_MS),
  );
  return Promise.race([write, timeout]);
};
