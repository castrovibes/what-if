// PLACEHOLDER CONTENT — marked in the database, not in the text.
//
// Seed content still awaiting the content team (prompts, tips, twists, series, FAQ,
// "I'm concerned" resources) used to start with a visible "[PLACEHOLDER]" tag, which
// beta testers would see over and over. This strips the tag from the text.
//
// The rows are still placeholders: every one keeps `is_placeholder = 1`, which is the
// source of truth. Query it to find what needs replacing, e.g.
//   SELECT id, text FROM prompts WHERE is_placeholder = 1;
// and replace them with a migration that DELETEs/UPDATEs WHERE is_placeholder = 1.

import * as SQLite from 'expo-sqlite';

const MARKER = '[PLACEHOLDER]';

const TEXT_COLUMNS: { table: string; columns: string[] }[] = [
  { table: 'prompts', columns: ['text'] },
  { table: 'tips', columns: ['body'] },
  { table: 'world_building', columns: ['card_text'] },
  { table: 'modules', columns: ['title', 'description'] },
  { table: 'faq_entries', columns: ['question', 'answer'] },
  { table: 'resources', columns: ['title', 'description'] },
];

export const migration_0011_strip_placeholder_markers = {
  name: '0011_strip_placeholder_markers',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    for (const { table, columns } of TEXT_COLUMNS) {
      for (const column of columns) {
        await db.runAsync(
          `UPDATE ${table}
             SET ${column} = TRIM(REPLACE(${column}, ?, ''))
           WHERE is_placeholder = 1 AND INSTR(${column}, ?) > 0`,
          MARKER,
          MARKER,
        );
      }
    }
  },
};
