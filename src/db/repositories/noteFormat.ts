// Pure note helpers, kept apart from notes.ts so tests can import them without SQLite.

export type Note = {
  id: string;
  folderId: string;
  /** Library or user-written prompt id; null for a general note. */
  promptId: string | null;
  /** Null when left blank: shown as the created date and time (noteDisplayTitle). */
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Local date and time, as a blank-titled note is shown: "Oct 22, 2026 · 3:41 PM". */
export function formatNoteDateTime(when: Date | string): string {
  const d = typeof when === 'string' ? new Date(when) : when;
  const hours = d.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h12}:${minutes} ${
    hours < 12 ? 'AM' : 'PM'
  }`;
}

/** The note's title, or its created date and time when the title is blank. */
export function noteDisplayTitle(note: Pick<Note, 'title' | 'createdAt'>): string {
  const title = note.title?.trim();
  return title ? title : formatNoteDateTime(note.createdAt);
}

/** A note with neither a title nor any body text is never saved. */
export function isEmptyNote(
  title: string | null | undefined,
  body: string | null | undefined,
): boolean {
  return !title?.trim() && !body?.trim();
}

/** A blank title is stored as NULL. */
export const normalizeNoteTitle = (title: string | null | undefined): string | null =>
  title?.trim() ? title : null;
