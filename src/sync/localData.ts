/**
 * Reads and replaces the synced tables in the on-device SQLite database.
 */
import { getDb } from '../db';
import { UserCollection } from '../backend/model';
import {
  ContextRecord,
  FavoriteRecord,
  ModuleProgressRecord,
  MyPromptRecord,
  RecordFor,
  ReflectionRecord,
} from './records';

/** The default context every device has; it is never deleted locally. */
export const DEFAULT_CONTEXT_ID = 'ctx-quick-start';

export const readAll = async (): Promise<{ [C in UserCollection]: RecordFor[C][] }> => {
  const db = await getDb();
  const contexts = await db.getAllAsync<{
    id: string;
    label: string;
    age_group_default: string | null;
    is_anonymous: number;
    color_token: string | null;
    created_at: string;
    archived_at: string | null;
  }>('SELECT * FROM contexts');
  const favorites = await db.getAllAsync<{
    context_id: string;
    prompt_id: string;
    favorited_at: string;
  }>('SELECT * FROM favorites');
  const reflections = await db.getAllAsync<{
    id: string;
    context_id: string;
    prompt_id: string;
    note: string | null;
    rating: number | null;
    created_at: string;
  }>('SELECT * FROM reflections');
  const progress = await db.getAllAsync<{
    context_id: string;
    module_id: string;
    prompt_id: string;
    completed_at: string | null;
  }>('SELECT * FROM module_progress');
  // The user's own prompts, deleted (hidden) ones included.
  const myPrompts = await db.getAllAsync<{
    id: string;
    text: string;
    age_group: string;
    is_active: number;
    created_at: string;
    updated_at: string;
    situations: string | null;
  }>(
    `SELECT p.id, p.text, p.age_group, p.is_active, p.created_at, p.updated_at,
            (SELECT GROUP_CONCAT(liminal_space_id) FROM prompt_liminal_spaces
              WHERE prompt_id = p.id) AS situations
       FROM prompts p WHERE p.source = 'user'`,
  );

  return {
    myPrompts: myPrompts.map(
      (p): MyPromptRecord => ({
        id: p.id,
        text: p.text,
        ageGroup: p.age_group as MyPromptRecord['ageGroup'],
        situations: p.situations ? p.situations.split(',') : [],
        deleted: p.is_active !== 1,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }),
    ),
    contexts: contexts.map(
      (c): ContextRecord => ({
        id: c.id,
        label: c.label,
        ageGroupDefault: (c.age_group_default as ContextRecord['ageGroupDefault']) ?? null,
        isAnonymous: c.is_anonymous === 1,
        colorToken: c.color_token,
        createdAt: c.created_at,
        archivedAt: c.archived_at,
      }),
    ),
    favorites: favorites.map(
      (f): FavoriteRecord => ({
        contextId: f.context_id,
        promptId: f.prompt_id,
        favoritedAt: f.favorited_at,
      }),
    ),
    reflections: reflections.map(
      (r): ReflectionRecord => ({
        id: r.id,
        contextId: r.context_id,
        promptId: r.prompt_id,
        note: r.note,
        rating: r.rating,
        createdAt: r.created_at,
      }),
    ),
    moduleProgress: progress.map(
      (p): ModuleProgressRecord => ({
        contextId: p.context_id,
        moduleId: p.module_id,
        promptId: p.prompt_id,
        completedAt: p.completed_at,
      }),
    ),
  };
};

/**
 * Makes the device match the cloud copy. Rows referring to prompts or series this
 * app version doesn't have (e.g. newer content) are skipped rather than failing.
 */
export const replaceAll = async (remote: { [C in UserCollection]: RecordFor[C][] }) => {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM favorites');
    await db.runAsync('DELETE FROM reflections');
    await db.runAsync('DELETE FROM module_progress');

    const skipBadReferences = async (run: () => Promise<unknown>) => {
      try {
        await run();
      } catch {
        // Foreign key: unknown prompt/series/context on this device. Keep it in the cloud.
      }
    };

    // The user's own prompts first, so favorites and notes can refer to them.
    for (const p of remote.myPrompts) {
      await db.runAsync(
        `INSERT INTO prompts
           (id, age_group, category_id, text, tier, source, parent_askable, is_active,
            is_placeholder, created_at, updated_at)
         VALUES (?, ?, NULL, ?, 'free', 'user', 0, ?, 0, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           age_group = excluded.age_group, text = excluded.text,
           is_active = excluded.is_active, updated_at = excluded.updated_at`,
        p.id,
        p.ageGroup,
        p.text,
        p.deleted ? 0 : 1,
        p.createdAt,
        p.updatedAt,
      );
      await db.runAsync('DELETE FROM prompt_liminal_spaces WHERE prompt_id = ?', p.id);
      for (const situation of p.situations) {
        await skipBadReferences(() =>
          db.runAsync(
            'INSERT INTO prompt_liminal_spaces (prompt_id, liminal_space_id) VALUES (?, ?)',
            p.id,
            situation,
          ),
        );
      }
    }
    // Own prompts on this device that the account doesn't have are hidden, not erased.
    const remoteIds = remote.myPrompts.map(p => p.id);
    await db.runAsync(
      `UPDATE prompts SET is_active = 0
        WHERE source = 'user' AND id NOT IN (${remoteIds.map(() => '?').join(',') || "''"})`,
      ...remoteIds,
    );

    for (const c of remote.contexts) {
      await db.runAsync(
        `INSERT INTO contexts (id, label, age_group_default, is_anonymous, color_token, created_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           label = excluded.label,
           age_group_default = excluded.age_group_default,
           is_anonymous = excluded.is_anonymous,
           color_token = excluded.color_token,
           archived_at = excluded.archived_at`,
        c.id,
        c.label,
        c.ageGroupDefault,
        c.isAnonymous ? 1 : 0,
        c.colorToken,
        c.createdAt,
        c.archivedAt,
      );
    }
    for (const f of remote.favorites) {
      await skipBadReferences(() =>
        db.runAsync(
          'INSERT OR REPLACE INTO favorites (context_id, prompt_id, favorited_at) VALUES (?, ?, ?)',
          f.contextId,
          f.promptId,
          f.favoritedAt,
        ),
      );
    }
    for (const r of remote.reflections) {
      await skipBadReferences(() =>
        db.runAsync(
          `INSERT OR REPLACE INTO reflections (id, context_id, prompt_id, note, audio_uri, rating, created_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?)`,
          r.id,
          r.contextId,
          r.promptId,
          r.note,
          r.rating,
          r.createdAt,
        ),
      );
    }
    for (const p of remote.moduleProgress) {
      await skipBadReferences(() =>
        db.runAsync(
          `INSERT OR REPLACE INTO module_progress (context_id, module_id, prompt_id, completed_at)
           VALUES (?, ?, ?, ?)`,
          p.contextId,
          p.moduleId,
          p.promptId,
          p.completedAt,
        ),
      );
    }
  });
};

/**
 * Removes the signed-in user's data from this device (used on sign-out, after it has
 * been pushed to the cloud). The default context is kept, reset to its defaults.
 */
export const clearUserData = async () => {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM favorites');
    await db.runAsync('DELETE FROM reflections');
    await db.runAsync('DELETE FROM module_progress');
    // The user's own prompts (their situations go with them).
    await db.runAsync("DELETE FROM prompts WHERE source = 'user'");
    await db.runAsync('DELETE FROM contexts WHERE id != ?', DEFAULT_CONTEXT_ID);
    await db.runAsync(
      'UPDATE contexts SET age_group_default = NULL, archived_at = NULL WHERE id = ?',
      DEFAULT_CONTEXT_ID,
    );
    await db.runAsync('DELETE FROM sync_outbox');
    await db.runAsync('DELETE FROM sync_state');
  });
};
