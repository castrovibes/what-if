/**
 * Keeps the signed-in user's data (contexts, favorites, reflections, series progress)
 * in sync between this device's SQLite database and Firestore.
 *
 * - The device database stays the source the screens read from.
 * - While signed in, every local change is queued in `sync_outbox` and pushed in
 *   order; the queue survives being offline or the app closing.
 * - On sign-in: the first time this device syncs with an account, data created here
 *   before signing in is uploaded into the account. Then the cloud copy is pulled
 *   down, so a new phone gets everything.
 * - On sign-out: pending changes are pushed, then the account's data is removed from
 *   the device, so the next person on a shared phone doesn't see (or upload) it.
 *
 * Personalization (child's name/town/interests) is deliberately not synced.
 */
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { getDb } from '../db';
import { getFirebase } from '../backend/firebase';
import { USER_COLLECTIONS, UserCollection, paths } from '../backend/model';
import { RecordFor, SyncRecord, docIdOf, fromRemote, toRemote } from './records';
import { clearUserData, readAll, replaceAll } from './localData';
import { emitSyncChange } from './events';

const SYNCED_UID_KEY = 'syncedUid';
const FLUSH_DELAY_MS = 300;

let currentUid: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

const getState = async (key: string) => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM sync_state WHERE key = ?',
    key,
  );
  return row?.value ?? null;
};

const setState = async (key: string, value: string) => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
};

const outboxCount = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox');
  return row?.n ?? 0;
};

const insertOutbox = async (
  coll: UserCollection,
  docId: string,
  op: 'set' | 'delete',
  record?: SyncRecord,
) => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sync_outbox (collection, doc_id, op, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    coll,
    docId,
    op,
    record ? JSON.stringify(record) : null,
    new Date().toISOString(),
  );
};

/** Pushes queued changes in order; stops at the first failure and retries later. */
const pushOutbox = async (uid: string) => {
  const db = await getDb();
  const { db: firestore } = getFirebase();
  const rows = await db.getAllAsync<{
    seq: number;
    collection: UserCollection;
    doc_id: string;
    op: 'set' | 'delete';
    payload: string | null;
  }>('SELECT * FROM sync_outbox ORDER BY seq');

  for (const row of rows) {
    const ref = doc(firestore, `${paths.userCollection(uid, row.collection)}/${row.doc_id}`);
    if (row.op === 'delete') {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, toRemote(row.collection, JSON.parse(row.payload ?? '{}')));
    }
    await db.runAsync('DELETE FROM sync_outbox WHERE seq = ?', row.seq);
  }
};

const fetchRemote = async (uid: string) => {
  const { db: firestore } = getFirebase();
  const result = {} as { [C in UserCollection]: RecordFor[C][] };
  for (const coll of USER_COLLECTIONS) {
    const snap = await getDocs(collection(firestore, paths.userCollection(uid, coll)));
    (result as Record<UserCollection, SyncRecord[]>)[coll] = snap.docs.map(d =>
      fromRemote(coll, d.id, d.data()),
    );
  }
  return result;
};

/** Queues every local row for upload (first sync of this device with an account). */
const adoptLocalData = async () => {
  const local = await readAll();
  for (const coll of USER_COLLECTIONS) {
    for (const record of local[coll] as SyncRecord[]) {
      await insertOutbox(coll, docIdOf(coll, record as never), 'set', record);
    }
  }
};

/**
 * Queue changes while signed in, and also while the saved session is still being
 * restored on launch (the device is already linked to an account) so none are missed.
 * Signed-out devices don't queue; their data is adopted on the next sign-in instead.
 */
const shouldQueue = async () => currentUid !== null || (await getState(SYNCED_UID_KEY)) !== null;

const runExclusive = (task: () => Promise<void>): Promise<void> => {
  const next = (flushing ?? Promise.resolve()).catch(() => {}).then(task);
  flushing = next.finally(() => {
    if (flushing === next) flushing = null;
  });
  return next;
};

export const SyncService = {
  /** Called by AuthProvider whenever the signed-in account changes. */
  async setUser(uid: string | null) {
    if (uid === currentUid) return;
    currentUid = uid;
    if (uid) await this.syncNow().catch(e => console.warn('Sync failed:', e));
  },

  /** Records a local change. A no-op on signed-out devices (data stays on the device). */
  async recordSet<C extends UserCollection>(coll: C, record: RecordFor[C]) {
    if (!(await shouldQueue())) return;
    await insertOutbox(coll, docIdOf(coll, record), 'set', record as SyncRecord);
    this.scheduleFlush();
  },

  async recordDelete(coll: UserCollection, docId: string) {
    if (!(await shouldQueue())) return;
    await insertOutbox(coll, docId, 'delete');
    this.scheduleFlush();
  },

  scheduleFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      const uid = currentUid;
      if (!uid) return;
      runExclusive(() => pushOutbox(uid)).catch(e => console.warn('Sync push failed:', e));
    }, FLUSH_DELAY_MS);
  },

  /** Full sync: adopt local data on first sync, push pending changes, pull the cloud copy. */
  syncNow(): Promise<void> {
    const uid = currentUid;
    if (!uid) return Promise.resolve();
    return runExclusive(async () => {
      if ((await getState(SYNCED_UID_KEY)) !== uid) {
        await adoptLocalData();
      }
      await pushOutbox(uid);
      await setState(SYNCED_UID_KEY, uid);

      const remote = await fetchRemote(uid);
      // A change made while we were fetching would be overwritten; apply next time.
      if ((await outboxCount()) > 0) return;
      await replaceAll(remote);
      emitSyncChange();
    });
  },

  /** After deleting the account: drop pending changes and the account's data here. */
  async discardAfterAccountDeletion() {
    currentUid = null;
    await clearUserData();
    emitSyncChange();
  },

  /** Before signing out: push what's pending, then remove the account's data here. */
  async signOut() {
    const uid = currentUid;
    if (uid) {
      await runExclusive(() => pushOutbox(uid)).catch(e =>
        console.warn('Could not push changes before sign-out:', e),
      );
    }
    currentUid = null;
    await clearUserData();
    emitSyncChange();
  },
};
