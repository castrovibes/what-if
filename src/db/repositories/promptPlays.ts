import { getDb } from '../index';
import { AgeGroupId } from '../../data/ageGroups';
import { PromptSource } from '../types';
import { PersonalizationData } from './personalization';
import { applyTokens } from '../../data/personalizationTokens';

/**
 * Prompts the deck has shown (on top for a few seconds), one row per prompt, for the
 * note editor's "recently played" menu. Library and user-written prompts share the
 * prompts table, so a prompt id alone identifies either. Local-only, like notes.
 */
export type PlayedPrompt = {
  promptId: string;
  /** Personalized, as the deck and Saved Prompts show it. */
  text: string;
  /** As stored, with any {name}/{location}/{interest} tokens. */
  rawText: string;
  source: PromptSource;
  ageGroup: AgeGroupId;
  /** Null when the prompt was looked up (get) but never played. */
  lastPlayedAt: string | null;
};

type Row = {
  id: string;
  text: string;
  source: string;
  age_group: string;
  last_played_at: string | null;
};

const fromRow = (r: Row, personalization: PersonalizationData): PlayedPrompt => ({
  promptId: r.id,
  text: applyTokens(r.text, personalization),
  rawText: r.text,
  source: r.source as PromptSource,
  ageGroup: r.age_group as AgeGroupId,
  lastPlayedAt: r.last_played_at,
});

export const PromptPlayRepo = {
  /** Marks the prompt as just played. */
  async record(promptId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO prompt_plays (prompt_id, last_played_at) VALUES (?, ?)
       ON CONFLICT(prompt_id) DO UPDATE SET last_played_at = excluded.last_played_at`,
      promptId,
      new Date().toISOString()
    );
  },

  /** The latest plays, newest first. Prompts since deleted (yours, hidden) are left out. */
  async listRecent(
    limit = 10,
    personalization: PersonalizationData = {}
  ): Promise<PlayedPrompt[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      `SELECT p.id, p.text, p.source, p.age_group, pp.last_played_at
         FROM prompt_plays pp JOIN prompts p ON p.id = pp.prompt_id
        WHERE p.is_active = 1
        ORDER BY pp.last_played_at DESC
        LIMIT ?`,
      limit
    );
    return rows.map(r => fromRow(r, personalization));
  },

  /**
   * One prompt by id, played or not, so the prompt a note is attached to can show even
   * when it's no longer recent. Deleted prompts are included: the note keeps its context.
   */
  async get(
    promptId: string,
    personalization: PersonalizationData = {}
  ): Promise<PlayedPrompt | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row>(
      `SELECT p.id, p.text, p.source, p.age_group, pp.last_played_at
         FROM prompts p LEFT JOIN prompt_plays pp ON pp.prompt_id = p.id
        WHERE p.id = ?`,
      promptId
    );
    return row ? fromRow(row, personalization) : null;
  },
};
