import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { NoteRepo, Note, isEmptyNote, trackNoteSave } from '../../db/repositories/notes';
import { haptic } from '../../ui/haptics';

type Draft = { title: string; body: string; promptId: string | null };

const DEBOUNCE_MS = 600;

/**
 * Autosave for the note editor. Edits are debounced; `flush` saves now (app going to
 * the background) and `finalize` also deletes a note emptied of its title and body
 * (leaving the screen). Every write runs on one promise chain reading the latest draft,
 * so a debounce and a flush that overlap can't create the note twice. An empty note is
 * never written.
 */
export function useNoteAutosave(folderId: string, initialPromptId: string | null) {
  const draft = useRef<Draft>({ title: '', body: '', promptId: initialPromptId });
  const noteId = useRef<string | null>(null);
  const dirty = useRef(false);
  const savedOnce = useRef(false);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  /** The note's created time once it exists (the title placeholder shows it). */
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const enqueue = useCallback(
    (removeIfEmpty: boolean) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      chain.current = chain.current
        .then(async () => {
          const { title, body, promptId } = draft.current;
          const id = noteId.current;
          if (isEmptyNote(title, body)) {
            if (removeIfEmpty && id) {
              await NoteRepo.remove(id);
              // Typing again (back from the Notebook) starts a new note.
              noteId.current = null;
              if (mounted.current) {
                setCreatedAt(null);
                setSaved(false);
              }
            }
            return;
          }
          if (!dirty.current) return;
          dirty.current = false;
          if (id) {
            await NoteRepo.update(id, { title, body, promptId });
          } else {
            const note = await NoteRepo.create({ folderId, promptId, title, body });
            noteId.current = note.id;
            if (mounted.current) setCreatedAt(note.createdAt);
          }
          if (!savedOnce.current) {
            savedOnce.current = true;
            haptic.success();
          }
          // Not if more typing came in while this write was in flight.
          if (mounted.current && !dirty.current) setSaved(true);
        })
        .catch(e => {
          // Try again on the next edit or flush.
          dirty.current = true;
          console.warn('Saving the note failed', e);
        });
      trackNoteSave(chain.current);
    },
    [folderId],
  );

  /** Takes an existing note as the starting point (no haptic on its later saves). */
  const load = useCallback((note: Note) => {
    draft.current = { title: note.title ?? '', body: note.body, promptId: note.promptId };
    noteId.current = note.id;
    savedOnce.current = true;
    setCreatedAt(note.createdAt);
  }, []);

  const edit = useCallback(
    (patch: Partial<Draft>) => {
      draft.current = { ...draft.current, ...patch };
      dirty.current = true;
      setSaved(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => enqueue(false), DEBOUNCE_MS);
    },
    [enqueue],
  );

  const flush = useCallback(() => enqueue(false), [enqueue]);
  const finalize = useCallback(() => enqueue(true), [enqueue]);

  // Save when the app is backgrounded; it may not come back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') flush();
    });
    return () => sub.remove();
  }, [flush]);

  // Last chance, if the screen goes away without beforeRemove (a tab reset).
  const finalizeRef = useRef(finalize);
  useEffect(() => {
    finalizeRef.current = finalize;
  }, [finalize]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      finalizeRef.current();
    };
  }, []);

  return { createdAt, saved, load, edit, flush, finalize };
}
