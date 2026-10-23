import { formatNoteDateTime, isEmptyNote, noteDisplayTitle } from '../noteFormat';

// Local times (no Z), so the expectations hold in any time zone.
const afternoon = new Date(2026, 9, 22, 15, 41).toISOString();

describe('formatNoteDateTime', () => {
  it('formats as "Mon D, YYYY · h:mm AM/PM"', () => {
    expect(formatNoteDateTime(new Date(2026, 9, 22, 15, 41))).toBe('Oct 22, 2026 · 3:41 PM');
    expect(formatNoteDateTime(new Date(2026, 0, 5, 9, 7))).toBe('Jan 5, 2026 · 9:07 AM');
  });

  it('shows midnight and noon as 12', () => {
    expect(formatNoteDateTime(new Date(2026, 11, 31, 0, 0))).toBe('Dec 31, 2026 · 12:00 AM');
    expect(formatNoteDateTime(new Date(2026, 5, 1, 12, 30))).toBe('Jun 1, 2026 · 12:30 PM');
  });

  it('accepts an ISO string', () => {
    expect(formatNoteDateTime(afternoon)).toBe('Oct 22, 2026 · 3:41 PM');
  });
});

describe('noteDisplayTitle', () => {
  it('uses the title when there is one', () => {
    expect(noteDisplayTitle({ title: 'Car ride chat', createdAt: afternoon })).toBe('Car ride chat');
  });

  it('falls back to the created date and time when the title is null or blank', () => {
    expect(noteDisplayTitle({ title: null, createdAt: afternoon })).toBe('Oct 22, 2026 · 3:41 PM');
    expect(noteDisplayTitle({ title: '   ', createdAt: afternoon })).toBe('Oct 22, 2026 · 3:41 PM');
  });
});

describe('isEmptyNote', () => {
  it('is empty with no title and no body text', () => {
    expect(isEmptyNote(null, '')).toBe(true);
    expect(isEmptyNote('  ', ' \n\t ')).toBe(true);
    expect(isEmptyNote(undefined, undefined)).toBe(true);
  });

  it('is not empty with a title or any body text', () => {
    expect(isEmptyNote('Bedtime', '')).toBe(false);
    expect(isEmptyNote(null, 'She said she would share.')).toBe(false);
  });
});
