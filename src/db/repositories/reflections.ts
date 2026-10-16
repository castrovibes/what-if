import { getDb } from '../index';
import { SyncService } from '../../sync/syncService';

export type ReflectionInput = {
  contextId: string;
  promptId: string;
  note: string | null;
  rating: number | null;
};

export type Reflection = {
  id: string;
  contextId: string;
  promptId: string;
  note: string | null;
  rating: number | null;
  createdAt: string;
};

type Row = {
  id: string;
  context_id: string;
  prompt_id: string;
  note: string | null;
  audio_uri: string | null;
  rating: number | null;
  created_at: string;
};

const fromRow = (r: Row): Reflection => ({
  id: r.id,
  contextId: r.context_id,
  promptId: r.prompt_id,
  note: r.note,
  rating: r.rating,
  createdAt: r.created_at,
});

export const ReflectionRepo = {
  async create(input: ReflectionInput): Promise<Reflection> {
    const db = await getDb();
    const id = `refl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO reflections (id, context_id, prompt_id, note, audio_uri, rating, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      id,
      input.contextId,
      input.promptId,
      input.note,
      input.rating,
      now
    );
    await SyncService.recordSet('reflections', {
      id,
      contextId: input.contextId,
      promptId: input.promptId,
      note: input.note,
      rating: input.rating,
      createdAt: now,
    });
    return {
      id,
      contextId: input.contextId,
      promptId: input.promptId,
      note: input.note,
      rating: input.rating,
      createdAt: now,
    };
  },

  async listForContext(contextId: string, limit = 20): Promise<Reflection[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM reflections WHERE context_id = ? ORDER BY created_at DESC LIMIT ?',
      contextId,
      limit
    );
    return rows.map(fromRow);
  },
};
