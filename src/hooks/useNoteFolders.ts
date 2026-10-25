import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NoteFolderRepo, NoteFolder } from '../db/repositories/notes';

/**
 * The Notebook's folders, in tab order; null until the first load. Reloads whenever the
 * screen comes into view; call `refresh` after changing folders through NoteFolderRepo.
 */
export function useNoteFolders(): { folders: NoteFolder[] | null; refresh: () => Promise<void> } {
  const [folders, setFolders] = useState<NoteFolder[] | null>(null);

  const refresh = useCallback(async () => {
    setFolders(await NoteFolderRepo.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { folders, refresh };
}
