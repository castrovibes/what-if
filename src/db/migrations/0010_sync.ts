// Tables for syncing the signed-in user's data to the cloud (src/sync/).
//
// sync_outbox: local changes waiting to be written to Firestore, in order. Rows are
//              removed once written, so changes survive being offline or the app closing.
// sync_state:  small key/value store (e.g. which account this device last synced with).

import * as SQLite from 'expo-sqlite';

export const migration_0010_sync = {
  name: '0010_sync',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
      CREATE TABLE sync_outbox (
        seq         INTEGER PRIMARY KEY AUTOINCREMENT,
        collection  TEXT NOT NULL,
        doc_id      TEXT NOT NULL,
        op          TEXT NOT NULL CHECK (op IN ('set', 'delete')),
        payload     TEXT,
        created_at  TEXT NOT NULL
      );

      CREATE TABLE sync_state (
        key    TEXT PRIMARY KEY,
        value  TEXT
      );
    `);
  },
};
