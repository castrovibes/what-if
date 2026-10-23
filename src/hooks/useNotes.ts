import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NoteRepo, Note, noteSavesSettled } from '../db/repositories/notes';

/**
 * The notes in a folder, most recently edited first; null until loaded (and while a
 * newly chosen folder loads). Reloads on focus, e.g. back from the editor; call
 * `refresh` after changing notes through NoteRepo.
 */
export function useNotes(folderId: string): { notes: Note[] | null; refresh: () => Promise<void> } {
  // Kept with the folder it belongs to, so a previous tab's list never shows under a new one.
  const [loaded, setLoaded] = useState<{ folderId: string; notes: Note[] } | null>(null);

  const refresh = useCallback(async () => {
    await noteSavesSettled();
    const notes = await NoteRepo.listForFolder(folderId);
    setLoaded({ folderId, notes });
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // After any save the editor started on the way back here.
      noteSavesSettled()
        .then(() => NoteRepo.listForFolder(folderId))
        .then(notes => {
          if (!cancelled) setLoaded({ folderId, notes });
        });
      return () => {
        cancelled = true;
      };
    }, [folderId]),
  );

  return { notes: loaded?.folderId === folderId ? loaded.notes : null, refresh };
}
