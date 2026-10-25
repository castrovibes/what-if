import { getDb } from '../index';
import { Note, normalizeNoteTitle } from './noteFormat';

/**
 * The Notebook (Create tab): notes in folders, each optionally about a prompt.
 * Local-only in v1 (no SyncService calls): notes can hold a child's name, so like
 * personalization they stay on the device.
 */
export type { Note } from './noteFormat';
export { noteDisplayTitle, isEmptyNote, formatNoteDateTime } from './noteFormat';

export type NoteFolder = {
  id: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/** The built-in folder (migration 0014): renamable, never deleted, the default for new notes. */
export const GENERAL_FOLDER_ID = 'folder-general';

export type NoteInput = {
  folderId: string;
  promptId: string | null;
  title: string | null;
  body: string;
};

export type NotePatch = Partial<Pick<NoteInput, 'promptId' | 'title' | 'body'>>;

type FolderRow = {
  id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type NoteRow = {
  id: string;
  folder_id: string;
  prompt_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

const folderFromRow = (r: FolderRow): NoteFolder => ({
  id: r.id,
  name: r.name,
  position: r.position,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const noteFromRow = (r: NoteRow): Note => ({
  id: r.id,
  folderId: r.folder_id,
  promptId: r.prompt_id,
  title: r.title,
  body: r.body,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

let pendingSaves: Promise<unknown> = Promise.resolve();

/**
 * The note editor saves on leaving, after the screen it returns to has already asked for
 * its list; `trackNoteSave` registers such a write and `noteSavesSettled` waits for every
 * one registered so far, so the Notebook's list includes it.
 */
export function trackNoteSave(save: Promise<unknown>): void {
  pendingSaves = Promise.all([pendingSaves, save]).catch(() => undefined);
}

export const noteSavesSettled = (): Promise<unknown> => pendingSaves;

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const NoteFolderRepo = {
  async list(): Promise<NoteFolder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<FolderRow>(
      'SELECT * FROM note_folders ORDER BY position, created_at'
    );
    return rows.map(folderFromRow);
  },

  /** Adds a folder after the last one. */
  async create(name: string): Promise<NoteFolder> {
    const db = await getDb();
    const id = newId('folder');
    const now = new Date().toISOString();
    const last = await db.getFirstAsync<{ p: number | null }>(
      'SELECT MAX(position) AS p FROM note_folders'
    );
    const position = (last?.p ?? -1) + 1;
    const trimmed = name.trim();
    await db.runAsync(
      `INSERT INTO note_folders (id, name, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      trimmed,
      position,
      now,
      now
    );
    return { id, name: trimmed, position, createdAt: now, updatedAt: now };
  },

  async rename(id: string, name: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE note_folders SET name = ?, updated_at = ? WHERE id = ?',
      name.trim(),
      new Date().toISOString(),
      id
    );
  },

  /** Deletes a folder, moving its notes to General. General itself can't be deleted. */
  async remove(id: string): Promise<void> {
    if (id === GENERAL_FOLDER_ID) throw new Error('The General folder cannot be deleted.');
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE notes SET folder_id = ? WHERE folder_id = ?',
        GENERAL_FOLDER_ID,
        id
      );
      await db.runAsync('DELETE FROM note_folders WHERE id = ?', id);
    });
  },
};

export const NoteRepo = {
  /** The folder's notes, most recently edited first. */
  async listForFolder(folderId: string): Promise<Note[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<NoteRow>(
      'SELECT * FROM notes WHERE folder_id = ? ORDER BY updated_at DESC',
      folderId
    );
    return rows.map(noteFromRow);
  },

  async get(id: string): Promise<Note | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
    return row ? noteFromRow(row) : null;
  },

  /** Writes a new note. Callers skip empty notes (isEmptyNote); a blank title is stored as NULL. */
  async create(input: NoteInput): Promise<Note> {
    const db = await getDb();
    const id = newId('note');
    const now = new Date().toISOString();
    const title = normalizeNoteTitle(input.title);
    await db.runAsync(
      `INSERT INTO notes (id, folder_id, prompt_id, title, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.folderId,
      input.promptId,
      title,
      input.body,
      now,
      now
    );
    return {
      id,
      folderId: input.folderId,
      promptId: input.promptId,
      title,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    };
  },

  /** Changes the given fields and bumps updated_at. A blank title is stored as NULL. */
  async update(id: string, patch: NotePatch): Promise<void> {
    const sets: string[] = [];
    const params: (string | null)[] = [];
    if (patch.promptId !== undefined) {
      sets.push('prompt_id = ?');
      params.push(patch.promptId);
    }
    if (patch.title !== undefined) {
      sets.push('title = ?');
      params.push(normalizeNoteTitle(patch.title));
    }
    if (patch.body !== undefined) {
      sets.push('body = ?');
      params.push(patch.body);
    }
    if (sets.length === 0) return;
    const db = await getDb();
    await db.runAsync(
      `UPDATE notes SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`,
      ...params,
      new Date().toISOString(),
      id
    );
  },

  /** Moves the note to another folder (its updated time stays, so it keeps its place). */
  async move(id: string, folderId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE notes SET folder_id = ? WHERE id = ?', folderId, id);
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  },
};
