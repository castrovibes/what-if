import { getDb } from '../index';
import { Context } from '../types';
import { AgeGroupId } from '../../data/ageGroups';
import { SyncService } from '../../sync/syncService';

const syncContext = (c: Context) => SyncService.recordSet('contexts', c);

type ContextRow = {
  id: string;
  label: string;
  age_group_default: string | null;
  is_anonymous: number;
  color_token: string | null;
  created_at: string;
  archived_at: string | null;
};

const fromRow = (r: ContextRow): Context => ({
  id: r.id,
  label: r.label,
  ageGroupDefault: (r.age_group_default as AgeGroupId | null) ?? null,
  isAnonymous: r.is_anonymous === 1,
  colorToken: r.color_token,
  createdAt: r.created_at,
  archivedAt: r.archived_at,
});

export const ContextRepo = {
  async list(): Promise<Context[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ContextRow>(
      'SELECT * FROM contexts WHERE archived_at IS NULL ORDER BY created_at'
    );
    return rows.map(fromRow);
  },

  async findById(id: string): Promise<Context | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ContextRow>('SELECT * FROM contexts WHERE id = ?', id);
    return row ? fromRow(row) : null;
  },

  async setAgeGroupDefault(id: string, ageGroup: AgeGroupId | null): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE contexts SET age_group_default = ? WHERE id = ?', ageGroup, id);
    const updated = await this.findById(id);
    if (updated) await syncContext(updated);
  },

  async create(input: {
    id: string;
    label: string;
    ageGroupDefault?: AgeGroupId | null;
    isAnonymous?: boolean;
    colorToken?: string | null;
  }): Promise<Context> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO contexts (id, label, age_group_default, is_anonymous, color_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.id,
      input.label,
      input.ageGroupDefault ?? null,
      input.isAnonymous ? 1 : 0,
      input.colorToken ?? null,
      now
    );
    const created = await this.findById(input.id);
    if (!created) throw new Error('Failed to create context');
    await syncContext(created);
    return created;
  },
};
