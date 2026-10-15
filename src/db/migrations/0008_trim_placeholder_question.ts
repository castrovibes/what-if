// PLACEHOLDER CONTENT
// The seeded placeholder prompts end with "What could you do?", which duplicates
// the full question shown under every prompt. Strip it from placeholder rows only;
// real prompts from the content team are left untouched.

import * as SQLite from 'expo-sqlite';

const SUFFIX = ' What could you do?';

export const migration_0008_trim_placeholder_question = {
  name: '0008_trim_placeholder_question',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE prompts
         SET text = substr(text, 1, length(text) - ?), updated_at = ?
       WHERE is_placeholder = 1 AND text LIKE ?`,
      SUFFIX.length,
      now,
      `%${SUFFIX}`
    );
  },
};
