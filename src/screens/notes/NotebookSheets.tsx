import React, { useEffect, useState } from 'react';
import { View, TextInput, Keyboard, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { BottomSheet, Button, ListRow } from '../../ui/components';
import { useSurface, PINK, INPUT_RADIUS } from '../../ui/surface';
import { GENERAL_FOLDER_ID, Note, NoteFolder, noteDisplayTitle } from '../../db/repositories/notes';

/** Folder names are short tab labels. */
export const FOLDER_NAME_MAX = 30;

/** What the folder sheet is showing: a tab's actions, its rename form, or a new folder form. */
export type FolderSheetState =
  | { mode: 'menu'; folder: NoteFolder }
  | { mode: 'rename'; folder: NoteFolder }
  | { mode: 'create' };

/**
 * The folder sheet. One sheet with steps rather than a sheet per step, since iOS won't
 * present a second modal while the first is still sliding away.
 */
export const NotebookFolderSheet = ({
  state,
  onClose,
  onRenameStart,
  onDelete,
  onSubmitName,
}: {
  /** Null closes the sheet. */
  state: FolderSheetState | null;
  onClose: () => void;
  onRenameStart: (folder: NoteFolder) => void;
  onDelete: (folder: NoteFolder) => void;
  onSubmitName: (state: FolderSheetState, name: string) => void;
}) => {
  // Keeps showing the last content while the sheet slides away after state goes null.
  const [s, setShown] = useState(state);
  if (state && state !== s) setShown(state);

  const title =
    s?.mode === 'create' ? 'New folder' : s?.mode === 'rename' ? 'Rename folder' : s?.folder.name ?? '';

  return (
    <BottomSheet visible={state !== null} title={title} onClose={onClose}>
      {s?.mode === 'menu' && (
        <View style={styles.menu}>
          <ListRow
            icon="edit-2"
            label="Rename"
            onPress={() => onRenameStart(s.folder)}
            chevron={false}
            last={s.folder.id === GENERAL_FOLDER_ID}
          />
          {s.folder.id !== GENERAL_FOLDER_ID && (
            <ListRow
              icon="trash-2"
              label="Delete folder"
              detail="Its notes move to General"
              onPress={() => onDelete(s.folder)}
              chevron={false}
              destructive
              last
            />
          )}
        </View>
      )}
      {(s?.mode === 'create' || s?.mode === 'rename') && (
        <FolderNameForm
          // A fresh form (and text) each time the sheet opens on a form.
          key={s.mode === 'rename' ? `rename-${s.folder.id}` : 'create'}
          initial={s.mode === 'rename' ? s.folder.name : ''}
          submitLabel={s.mode === 'rename' ? 'Rename' : 'Add folder'}
          onCancel={onClose}
          onSubmit={name => onSubmitName(s, name)}
        />
      )}
    </BottomSheet>
  );
};

const FolderNameForm = ({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const [name, setName] = useState(initial);
  const keyboard = useKeyboardSpacer();
  const trimmed = name.trim();
  const submit = () => {
    if (trimmed) onSubmit(trimmed);
  };
  return (
    <View style={{ paddingBottom: keyboard }}>
      <TextInput
        style={[
          styles.input,
          { color: colors.textPrimary, backgroundColor: surface.screen, borderColor: surface.border },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Folder name"
        placeholderTextColor={colors.iconInactive}
        maxLength={FOLDER_NAME_MAX}
        autoFocus
        selectTextOnFocus={!!initial}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={submit}
        cursorColor={PINK}
        selectionColor={PINK}
        accessibilityLabel="Folder name"
      />
      <View style={styles.buttons}>
        <View style={styles.flex}>
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
        <View style={styles.flex}>
          <Button label={submitLabel} onPress={submit} disabled={!trimmed} />
        </View>
      </View>
    </View>
  );
};

/** What the note sheet is showing: a note's actions, or the folders it can move to. */
export type NoteSheetState = { mode: 'menu' | 'move'; note: Note };

export const NotebookNoteSheet = ({
  state,
  folders,
  onClose,
  onMoveStart,
  onMove,
  onDelete,
}: {
  /** Null closes the sheet. */
  state: NoteSheetState | null;
  folders: NoteFolder[];
  onClose: () => void;
  onMoveStart: (note: Note) => void;
  onMove: (note: Note, folder: NoteFolder) => void;
  onDelete: (note: Note) => void;
}) => {
  const { colors } = useTheme();
  const [s, setShown] = useState(state);
  if (state && state !== s) setShown(state);
  const others = s ? folders.filter(f => f.id !== s.note.folderId) : [];

  return (
    <BottomSheet
      visible={state !== null}
      title={s?.mode === 'move' ? 'Move to folder' : s ? noteDisplayTitle(s.note) : ''}
      onClose={onClose}
    >
      {s?.mode === 'menu' && (
        <View style={styles.menu}>
          {others.length > 0 && (
            <ListRow
              icon="folder"
              label="Move to folder…"
              onPress={() => onMoveStart(s.note)}
              chevron={false}
            />
          )}
          <ListRow
            icon="trash-2"
            label="Delete note"
            onPress={() => onDelete(s.note)}
            chevron={false}
            destructive
            last
          />
        </View>
      )}
      {s?.mode === 'move' && (
        <View style={styles.menu}>
          {others.map((folder, i) => (
            <ListRow
              key={folder.id}
              icon="folder"
              iconColor={colors.iconDefault}
              label={folder.name}
              onPress={() => onMove(s.note, folder)}
              chevron={false}
              last={i === others.length - 1}
            />
          ))}
        </View>
      )}
    </BottomSheet>
  );
};

/**
 * Room for the keyboard under a sheet's text field. iOS modals don't resize for the
 * keyboard, so the sheet would sit behind it; Android's modal window resizes itself.
 */
function useKeyboardSpacer(): number {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', e =>
      setHeight(Math.max(0, e.endCoordinates.height - insets.bottom)),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);
  return height;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // ListRow pads itself for a card; in a sheet it lines up with the title instead.
  menu: {
    marginHorizontal: -Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
