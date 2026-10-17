// PLACEHOLDER CONTENT
// Injects personalization tokens ({name}, {location}, {interest}) into a few
// seeded prompts so the personalization feature has visible effect in dev/demo.
// Real prompts from the content team will have their own tokens authored in.

import * as SQLite from 'expo-sqlite';

const REWRITES: { id: string; text: string }[] = [
  {
    id: 'ph-6-8-001',
    text: 'What if you see someone being mean to {name} at school? What could you do?',
  },
  {
    id: 'ph-9-12-003',
    text: "What if {name} was struggling with {interest} but afraid to ask for help? What could you do?",
  },
  {
    id: 'ph-13-15-002',
    text: 'What if you discover {name} is being bullied online in {location}? What could you do?',
  },
];

export const migration_0004_personalization_tokens = {
  name: '0004_personalization_tokens',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    const now = new Date().toISOString();
    for (const r of REWRITES) {
      await db.runAsync(
        'UPDATE prompts SET text = ?, updated_at = ? WHERE id = ?',
        r.text,
        now,
        r.id
      );
    }
  },
};
