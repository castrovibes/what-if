import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { Screen, ScreenHeader, ScreenList, Card, Button } from '../../ui/components';
import { toast } from '../../ui/toast';
import { haptic } from '../../ui/haptics';
import { useNoteFolders } from '../../hooks/useNoteFolders';
import { useNotes } from '../../hooks/useNotes';
import {
  GENERAL_FOLDER_ID,
  Note,
  NoteFolder,
  NoteFolderRepo,
  NoteRepo,
  noteDisplayTitle,
} from '../../db/repositories/notes';
import { CreateStackParamList } from '../../navigation/types';
import { NotebookFolderTabs } from './NotebookFolderTabs';
import { NotebookNoteRow, useNotePrompts } from './NotebookNotes';
import {
  NotebookFolderSheet,
  NotebookNoteSheet,
  FolderSheetState,
  NoteSheetState,
} from './NotebookSheets';

// iOS drops an Alert presented while a sheet's modal is still closing (220 ms).
const AFTER_SHEET_MS = 300;
const afterSheet = (fn: () => void) => setTimeout(fn, AFTER_SHEET_MS);

/**
 * Notebook: the user's notes, grouped into folders shown as tabs (docs/NOTES_PLAN.md).
 * Long-press a tab to rename or delete it, or a note to move or delete it.
 */
export const NotebookScreen = () => {
  const navigation = useNavigation<NavigationProp<CreateStackParamList>>();
  const route = useRoute<RouteProp<CreateStackParamList, 'Notebook'>>();
  const { colors } = useTheme();
  const paramFolderId = route.params?.folderId;

  const [activeId, setActiveId] = useState(paramFolderId ?? GENERAL_FOLDER_ID);
  // Opening the Notebook again with a folder (e.g. from the editor) switches to it.
  const [seenParam, setSeenParam] = useState(paramFolderId);
  if (paramFolderId !== seenParam) {
    setSeenParam(paramFolderId);
    if (paramFolderId) setActiveId(paramFolderId);
  }

  const { folders, refresh: refreshFolders } = useNoteFolders();
  // A folder that's gone (deleted, or a stale param) falls back to General.
  const currentId =
    folders && !folders.some(f => f.id === activeId) ? GENERAL_FOLDER_ID : activeId;
  const current = folders?.find(f => f.id === currentId);
  const { notes, refresh: refreshNotes } = useNotes(currentId);
  const prompts = useNotePrompts(notes);

  const [folderSheet, setFolderSheet] = useState<FolderSheetState | null>(null);
  const [noteSheet, setNoteSheet] = useState<NoteSheetState | null>(null);

  const newNote = () => navigation.navigate('NoteEditor', { folderId: currentId });

  const selectFolder = (folder: NoteFolder) => {
    if (folder.id === currentId) return;
    haptic.selection();
    setActiveId(folder.id);
  };

  const submitFolderName = async (state: FolderSheetState, name: string) => {
    setFolderSheet(null);
    if (state.mode === 'create') {
      const folder = await NoteFolderRepo.create(name);
      await refreshFolders();
      setActiveId(folder.id);
      toast.show({ message: `Added “${folder.name}”`, icon: 'folder-plus' });
    } else if (state.mode === 'rename' && name !== state.folder.name) {
      await NoteFolderRepo.rename(state.folder.id, name);
      await refreshFolders();
      toast.show({ message: `Renamed to “${name}”`, icon: 'check' });
    }
  };

  const confirmDeleteFolder = (folder: NoteFolder) => {
    setFolderSheet(null);
    afterSheet(() =>
      Alert.alert(`Delete “${folder.name}”?`, 'Its notes move to General.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await NoteFolderRepo.remove(folder.id);
            setActiveId(GENERAL_FOLDER_ID);
            // If General was already open, its list now holds the moved notes.
            await Promise.all([refreshFolders(), refreshNotes()]);
          },
        },
      ]),
    );
  };

  const moveNote = async (note: Note, folder: NoteFolder) => {
    setNoteSheet(null);
    await NoteRepo.move(note.id, folder.id);
    await refreshNotes();
    toast.show({ message: `Moved to “${folder.name}”`, icon: 'folder' });
  };

  const confirmDeleteNote = (note: Note) => {
    setNoteSheet(null);
    afterSheet(() =>
      Alert.alert('Delete this note?', noteDisplayTitle(note), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await NoteRepo.remove(note.id);
            await refreshNotes();
          },
        },
      ]),
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <NotebookNoteRow
      note={item}
      prompt={item.promptId ? prompts[item.promptId] : null}
      onPress={() => navigation.navigate('NoteEditor', { noteId: item.id, folderId: currentId })}
      onLongPress={() => {
        haptic.selection();
        setNoteSheet({ mode: 'menu', note: item });
      }}
    />
  );

  return (
    <Screen>
      <ScreenHeader
        title="Notebook"
        onBack={() => navigation.goBack()}
        rightIcon="plus"
        rightLabel="New note"
        onRightPress={newNote}
      />
      {folders && (
        <NotebookFolderTabs
          folders={folders}
          activeId={currentId}
          onSelect={selectFolder}
          onLongPress={folder => {
            haptic.selection();
            setFolderSheet({ mode: 'menu', folder });
          }}
          onAdd={() => setFolderSheet({ mode: 'create' })}
        />
      )}
      {/* Nothing shows while a folder's notes load (a local read, so only a moment),
          so the empty card doesn't flash before the list arrives. */}
      <ScreenList
        data={notes}
        keyExtractor={n => n.id}
        renderItem={renderNote}
        ListEmptyComponent={
          notes === null ? undefined : (
            <Card style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {current ? `Nothing in ${current.name} yet` : 'No notes yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Jot down what came up in a conversation, or anything you want to remember.
              </Text>
              <Button label="Write a note" icon="edit-3" onPress={newNote} />
            </Card>
          )
        }
      />
      <NotebookFolderSheet
        state={folderSheet}
        onClose={() => setFolderSheet(null)}
        onRenameStart={folder => setFolderSheet({ mode: 'rename', folder })}
        onDelete={confirmDeleteFolder}
        onSubmitName={submitFolderName}
      />
      <NotebookNoteSheet
        state={noteSheet}
        folders={folders ?? []}
        onClose={() => setNoteSheet(null)}
        onMoveStart={note => setNoteSheet({ mode: 'move', note })}
        onMove={moveNote}
        onDelete={confirmDeleteNote}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    textAlign: 'center',
  },
});
