// PLACEHOLDER CONTENT — marked in the database (is_placeholder = 1), not in the text.
//
// 1. Situations: a prompt can now suit several situations ("Car Ride", "Bedtime"…),
//    stored in prompt_liminal_spaces. The old single prompts.liminal_space column is
//    copied in and no longer used for filtering. Every placeholder prompt gets one or
//    two situations, chosen so each situation has at least one prompt per age group.
//
// 2. Twists: every placeholder prompt gets one twist per difficulty (1 Gentle,
//    2 Deeper, 3 Challenging), replacing the earlier placeholder twists.
//
// The real library from the content team replaces these rows WHERE is_placeholder = 1
// (see content/Ethical_Choices_App_Full_Prompt_Library.xlsx, which mirrors this content).

import * as SQLite from 'expo-sqlite';

const SITUATIONS: Record<string, string[]> = {
  'ph-3-5-001': ['ls-waiting-room', 'ls-car-ride'],
  'ph-3-5-002': ['ls-mealtime', 'ls-car-ride'],
  'ph-3-5-003': ['ls-bedtime'],
  'ph-6-8-001': ['ls-car-ride', 'ls-mealtime'],
  'ph-6-8-002': ['ls-mealtime', 'ls-car-ride'],
  'ph-6-8-003': ['ls-waiting-room', 'ls-bedtime'],
  'ph-9-12-001': ['ls-car-ride', 'ls-mealtime'],
  'ph-9-12-002': ['ls-car-ride', 'ls-waiting-room'],
  'ph-9-12-003': ['ls-mealtime', 'ls-bedtime'],
  'ph-13-15-001': ['ls-car-ride', 'ls-waiting-room'],
  'ph-13-15-002': ['ls-mealtime', 'ls-waiting-room'],
  'ph-13-15-003': ['ls-car-ride', 'ls-bedtime'],
};

// [Gentle, Deeper, Challenging]
const TWISTS: Record<string, [string, string, string]> = {
  'ph-3-5-001': [
    'What if it was your favorite toy?',
    'What if the other kid was your best friend?',
    'What if the other kid had waited a really long time for a turn too?',
  ],
  'ph-3-5-002': [
    'What if no one saw it happen?',
    "What if the juice spilled on someone else's drawing?",
    'What if a grown-up thought someone else did it?',
  ],
  'ph-3-5-003': [
    'What if your favorite stuffed animal was there with you?',
    'What if you heard a strange noise outside?',
    'What if the grown-ups were already asleep?',
  ],
  'ph-6-8-001': [
    'What if a teacher was nearby?',
    'What if the person being mean was one of your friends?',
    'What if standing up for {name} meant the mean kids might pick on you next?',
  ],
  'ph-6-8-002': [
    'What if your friend said it was okay?',
    'What if it was something your friend made by hand?',
    'What if no one would ever find out it was you?',
  ],
  'ph-6-8-003': [
    'What if one other kid was also playing alone?',
    'What if the kids leaving you out were your friends yesterday?',
    'What if it kept happening every day for a week?',
  ],
  'ph-9-12-001': [
    'What if it was just a small lie?',
    'What if the parents would find out anyway?',
    "What if your friend said they wouldn't be your friend anymore if you said no?",
  ],
  'ph-9-12-002': [
    "What if it was a practice quiz that didn't count?",
    'What if the person cheating was your best friend?',
    'What if the test was graded on a curve, so their cheating lowered your grade?',
  ],
  'ph-9-12-003': [
    'What if the person who could help was a friend?',
    "What if {name} had already asked once and still didn't understand?",
    'What if asking for help meant admitting {name} had been pretending to understand?',
  ],
  'ph-13-15-001': [
    'What if one other person in the group seemed uncomfortable too?',
    'What if everyone else in the group was already doing it?',
    'What if saying no meant losing the friend group?',
  ],
  'ph-13-15-002': [
    "What if {name} hadn't seen the posts yet?",
    'What if the person posting was someone you know?',
    'What if speaking up meant the posts might start being about you?',
  ],
  'ph-13-15-003': [
    'What if the decision was about your weekend plans?',
    'What if your brother or sister agreed with your parents?',
    "What if your parents had a good reason they hadn't told you yet?",
  ],
};

export const migration_0012_twists_and_situations = {
  name: '0012_twists_and_situations',
  async up(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
      CREATE TABLE prompt_liminal_spaces (
        prompt_id        TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        liminal_space_id TEXT NOT NULL REFERENCES liminal_spaces(id) ON DELETE CASCADE,
        PRIMARY KEY (prompt_id, liminal_space_id)
      );
      CREATE INDEX idx_prompt_liminal_spaces_space ON prompt_liminal_spaces(liminal_space_id);
      INSERT INTO prompt_liminal_spaces (prompt_id, liminal_space_id)
        SELECT id, liminal_space FROM prompts WHERE liminal_space IS NOT NULL;
    `);

    for (const [promptId, spaces] of Object.entries(SITUATIONS)) {
      const exists = await db.getFirstAsync(
        'SELECT 1 FROM prompts WHERE id = ? AND is_placeholder = 1',
        promptId,
      );
      if (!exists) continue;
      for (const space of spaces) {
        await db.runAsync(
          'INSERT OR IGNORE INTO prompt_liminal_spaces (prompt_id, liminal_space_id) VALUES (?, ?)',
          promptId,
          space,
        );
      }
    }

    await db.runAsync('DELETE FROM world_building WHERE is_placeholder = 1');
    for (const [promptId, twists] of Object.entries(TWISTS)) {
      const exists = await db.getFirstAsync(
        'SELECT 1 FROM prompts WHERE id = ? AND is_placeholder = 1',
        promptId,
      );
      if (!exists) continue;
      for (let i = 0; i < twists.length; i++) {
        const difficulty = i + 1;
        await db.runAsync(
          `INSERT INTO world_building (id, prompt_id, card_text, display_order, difficulty, is_placeholder)
           VALUES (?, ?, ?, ?, ?, 1)`,
          `${promptId}-tw-${difficulty}`,
          promptId,
          twists[i],
          difficulty,
          difficulty,
        );
      }
    }
  },
};
