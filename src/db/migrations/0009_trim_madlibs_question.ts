// PLACEHOLDER CONTENT
// Same cleanup as 0008, for the placeholder Mad Libs templates. A filled-in
// Mad Lib is saved as a prompt, so a template ending in "What could you do?"
// would repeat the full question shown under every prompt card.

import * as SQLite from 'expo-sqlite';

const SUFFIX = ' What could you do?';

export const migration_0009_trim_madlibs_question = {
  name: '0009_trim_madlibs_question',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.runAsync(
      `UPDATE mad_libs_templates
         SET template_text = substr(template_text, 1, length(template_text) - ?)
       WHERE is_placeholder = 1 AND template_text LIKE ?`,
      SUFFIX.length,
      `%${SUFFIX}`
    );
  },
};
