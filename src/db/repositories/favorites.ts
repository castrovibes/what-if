import { getDb } from '../index';
import { SyncService } from '../../sync/syncService';
import { docIds } from '../../backend/model';

export const FavoritesRepo = {
  async listForContext(contextId: string): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ prompt_id: string }>(
      'SELECT prompt_id FROM favorites WHERE context_id = ? ORDER BY favorited_at DESC',
      contextId
    );
    return rows.map(r => r.prompt_id);
  },

  async add(contextId: string, promptId: string): Promise<void> {
    const db = await getDb();
    const favoritedAt = new Date().toISOString();
    await db.runAsync(
      'INSERT OR IGNORE INTO favorites (context_id, prompt_id, favorited_at) VALUES (?, ?, ?)',
      contextId,
      promptId,
      favoritedAt
    );
    await SyncService.recordSet('favorites', { contextId, promptId, favoritedAt });
  },

  async remove(contextId: string, promptId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'DELETE FROM favorites WHERE context_id = ? AND prompt_id = ?',
      contextId,
      promptId
    );
    await SyncService.recordDelete('favorites', docIds.favorite(contextId, promptId));
  },
};
