import { getDb } from '../index';
import { AgeGroupId } from '../../data/ageGroups';

/**
 * Prompts the user made (the blank creator and Mad Libs). They're ordinary prompts
 * with source 'user', so the deck can show them; situations go in
 * prompt_liminal_spaces like the library's. Deleting hides a prompt (is_active = 0)
 * rather than removing the row, so notes and favorites that point at it stay valid.
 * They live on the phone only for now (TESTFLIGHT_CHECKLIST.md, 2c item 4e).
 */
export type UserPrompt = {
  id: string;
  text: string;
  ageGroup: AgeGroupId;
  situations: string[];
  createdAt: string;
  updatedAt: string;
};

/** Longest prompt text the creators accept (fits the card at its smallest text size). */
export const USER_PROMPT_MAX_LENGTH = 150;

type Row = {
  id: string;
  text: string;
  age_group: string;
  created_at: string;
  updated_at: string;
  situations: string | null;
};

const fromRow = (r: Row): UserPrompt => ({
  id: r.id,
  text: r.text,
  ageGroup: r.age_group as AgeGroupId,
  situations: r.situations ? r.situations.split(',') : [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const SELECT = `
  SELECT p.id, p.text, p.age_group, p.created_at, p.updated_at,
         (SELECT GROUP_CONCAT(liminal_space_id) FROM prompt_liminal_spaces
           WHERE prompt_id = p.id) AS situations
    FROM prompts p
   WHERE p.source = 'user' AND p.is_active = 1`;

export const newUserPromptId = () =>
  `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const UserPromptRepo = {
  async list(): Promise<UserPrompt[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(`${SELECT} ORDER BY p.created_at DESC`);
    return rows.map(fromRow);
  },

  async get(id: string): Promise<UserPrompt | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row>(`${SELECT} AND p.id = ?`, id);
    return row ? fromRow(row) : null;
  },

  async count(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM prompts WHERE source = 'user' AND is_active = 1",
    );
    return row?.n ?? 0;
  },

  /** Creates the prompt, or updates it if `id` already exists. */
  async save(input: {
    id: string;
    text: string;
    ageGroup: AgeGroupId;
    situations: string[];
  }): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO prompts
           (id, age_group, category_id, text, tier, source, parent_askable, is_active,
            is_placeholder, created_at, updated_at)
         VALUES (?, ?, NULL, ?, 'free', 'user', 0, 1, 0, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           age_group = excluded.age_group, text = excluded.text,
           updated_at = excluded.updated_at`,
        input.id,
        input.ageGroup,
        input.text,
        now,
        now,
      );
      await db.runAsync('DELETE FROM prompt_liminal_spaces WHERE prompt_id = ?', input.id);
      for (const situation of input.situations) {
        await db.runAsync(
          'INSERT INTO prompt_liminal_spaces (prompt_id, liminal_space_id) VALUES (?, ?)',
          input.id,
          situation,
        );
      }
    });
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "UPDATE prompts SET is_active = 0, updated_at = ? WHERE id = ? AND source = 'user'",
      new Date().toISOString(),
      id,
    );
  },
};
