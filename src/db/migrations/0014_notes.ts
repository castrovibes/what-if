// Notes (the Create tab's Notebook): free-text notes in folders, optionally about a prompt.
// Local-only for now: notes can hold a child's name, so like personalization they don't sync.
//
// note_folders: the Notebook's tabs, in `position` order. 'folder-general' is built in:
//               it can be renamed but not deleted, and takes a deleted folder's notes.
// notes:        prompt_id is any prompt's id (library or user-written, which share the
//               prompts table and can't collide), or NULL for a general note. title is
//               NULL when left blank; it's then shown as the created date and time.
// prompt_plays: one row per prompt the deck has shown for a few seconds, for the
//               editor's "recently played" menu.

import * as SQLite from 'expo-sqlite';

export const migration_0014_notes = {
  name: '0014_notes',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
      CREATE TABLE note_folders (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        position    INTEGER NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE TABLE notes (
        id          TEXT PRIMARY KEY,
        folder_id   TEXT NOT NULL REFERENCES note_folders(id),
        prompt_id   TEXT,
        title       TEXT,
        body        TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE INDEX idx_notes_folder_updated ON notes(folder_id, updated_at DESC);

      CREATE TABLE prompt_plays (
        prompt_id       TEXT PRIMARY KEY,
        last_played_at  TEXT NOT NULL
      );
    `);
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO note_folders (id, name, position, created_at, updated_at)
       VALUES ('folder-general', 'General', 0, ?, ?)`,
      now,
      now
    );
  },
};
