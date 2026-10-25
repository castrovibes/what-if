import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  NavigationProp,
  RouteProp,
  StackActions,
} from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { Screen, Dot } from '../../ui/components';
import { useSurface, PINK } from '../../ui/surface';
import { haptic } from '../../ui/haptics';
import { useTabBarInset } from '../../navigation/tabBarInset';
import { CreateStackParamList } from '../../navigation/types';
import { findAgeGroup } from '../../data/ageGroups';
import { NoteRepo, GENERAL_FOLDER_ID, formatNoteDateTime } from '../../db/repositories/notes';
import { PromptPlayRepo, PlayedPrompt } from '../../db/repositories/promptPlays';
import { useRecentPrompts } from '../../hooks/useRecentPrompts';
import { usePersonalization } from '../../hooks/usePersonalization';
import { useNoteAutosave } from './NoteEditorAutosave';
import { NoteEditorPromptMenu, NoteEditorPromptMenuBackdrop } from './NoteEditorPromptMenu';

/** Whether the software keyboard is up (it covers the floating tab bar while it is). */
const useKeyboardUp = () => {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setUp(true),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setUp(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return up;
};

/**
 * Write a note (docs/NOTES_PLAN.md): optionally about a recently played prompt, with an
 * optional title (blank shows the date and time), saved as you type. Opens an existing
 * note with `noteId`; a new note goes in `folderId` (General by default) and can start
 * with `promptId` attached.
 */
export const NoteEditorScreen = () => {
  const navigation = useNavigation<NavigationProp<CreateStackParamList>>();
  const route = useRoute<RouteProp<CreateStackParamList, 'NoteEditor'>>();
  const noteIdParam = route.params?.noteId;
  const folderId = route.params?.folderId ?? GENERAL_FOLDER_ID;
  const { colors } = useTheme();
  const surface = useSurface();
  const tabInset = useTabBarInset();
  const keyboardUp = useKeyboardUp();
  const personalization = usePersonalization();
  const { prompts: recent } = useRecentPrompts();

  const initialPromptId = noteIdParam ? null : (route.params?.promptId ?? null);
  const autosave = useNoteAutosave(folderId, initialPromptId);
  const { load, edit, finalize } = autosave;

  const [loaded, setLoaded] = useState(!noteIdParam);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [promptId, setPromptId] = useState<string | null>(initialPromptId);
  const [menuOpen, setMenuOpen] = useState(false);
  // The time a new note will get, for the title placeholder until it's saved.
  const [openedAt] = useState(() => new Date());
  const bodyRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!noteIdParam) return;
    let live = true;
    NoteRepo.get(noteIdParam).then(note => {
      if (!live) return;
      // A note deleted meanwhile opens as a new one.
      if (note) {
        load(note);
        setTitle(note.title ?? '');
        setBody(note.body);
        setPromptId(note.promptId);
      }
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [noteIdParam, load]);

  // Save (or drop an emptied note) when leaving, including to the Notebook.
  useEffect(() => {
    const offRemove = navigation.addListener('beforeRemove', finalize);
    const offBlur = navigation.addListener('blur', finalize);
    return () => {
      offRemove();
      offBlur();
    };
  }, [navigation, finalize]);

  // The attached prompt: from the recent list, or looked up when it isn't recent. The
  // lookup is kept, so the note's own prompt stays in the menu after switching away.
  const inRecent = promptId ? recent?.find(p => p.promptId === promptId) : undefined;
  const [lookedUp, setLookedUp] = useState<PlayedPrompt | null>(null);
  const needsLookup = !!promptId && recent !== null && !inRecent;
  useEffect(() => {
    if (!needsLookup || !promptId) return;
    let live = true;
    PromptPlayRepo.get(promptId, personalization).then(p => {
      if (live && p) setLookedUp(p);
    });
    return () => {
      live = false;
    };
  }, [needsLookup, promptId, personalization]);
  const attached = inRecent ?? (lookedUp && lookedUp.promptId === promptId ? lookedUp : null);
  const menuPrompts = [
    ...(lookedUp && !recent?.some(p => p.promptId === lookedUp.promptId) ? [lookedUp] : []),
    ...(recent ?? []),
  ];
  const attachedAge = attached ? findAgeGroup(attached.ageGroup) : undefined;

  const openMenu = () => {
    if (!menuOpen) Keyboard.dismiss();
    setMenuOpen(o => !o);
  };

  const selectPrompt = (id: string | null) => {
    setMenuOpen(false);
    if (id !== promptId) {
      haptic.selection();
      setPromptId(id);
      edit({ promptId: id });
    }
    bodyRef.current?.focus();
  };

  const pillLabel = promptId ? (attached?.text ?? 'Prompt') : 'General note';
  const placeholderTitle = formatNoteDateTime(autosave.createdAt ?? openedAt);

  return (
    <Screen>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Feather name="chevron-left" size={26} color={surface.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openMenu}
            activeOpacity={0.85}
            style={[styles.pill, { backgroundColor: surface.card, borderColor: surface.border }]}
            accessibilityRole="button"
            accessibilityLabel={`About: ${pillLabel}`}
            accessibilityHint="Choose a recently played prompt, or a general note"
            accessibilityState={{ expanded: menuOpen }}
          >
            {attachedAge && <Dot color={attachedAge.bgColor} />}
            <Text style={[styles.pillText, { color: colors.textPrimary }]} numberOfLines={1}>
              {pillLabel}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.iconDefault} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            onPress={() =>
              // Back to the Notebook below rather than stacking another (React Navigation 7's
              // navigate pushes); pushed only when the editor was opened from elsewhere.
              navigation.getState()?.routes.some(r => r.name === 'Notebook')
                ? navigation.dispatch(StackActions.popTo('Notebook', { folderId }))
                : navigation.navigate('Notebook', { folderId })
            }
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notebook"
          >
            <Feather name="book" size={22} color={surface.accent} />
          </TouchableOpacity>
        </View>
        {menuOpen && (
          <NoteEditorPromptMenu
            prompts={menuPrompts}
            selectedId={promptId}
            onSelect={selectPrompt}
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {attached && (
          <View style={[styles.context, { borderLeftColor: attachedAge?.bgColor ?? PINK }]}>
            <Text style={[styles.contextText, { color: colors.textSecondary }]}>
              {attached.text}
            </Text>
          </View>
        )}

        {loaded && (
          <View
            style={[
              styles.editor,
              // The keyboard covers the floating tab bar, so it only needs clearing without it.
              { paddingBottom: keyboardUp ? Spacing.sm : tabInset + Spacing.sm },
            ]}
          >
            <TextInput
              style={[styles.title, { color: surface.accent }]}
              value={title}
              onChangeText={t => {
                setTitle(t);
                edit({ title: t });
              }}
              placeholder={placeholderTitle}
              placeholderTextColor={colors.textSecondary}
              cursorColor={PINK}
              selectionColor={PINK}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => bodyRef.current?.focus()}
              accessibilityLabel="Title (optional)"
            />
            <Text style={[styles.status, { color: colors.textSecondary }]}>
              {autosave.saved ? 'Saved' : ' '}
            </Text>
            <TextInput
              ref={bodyRef}
              style={[styles.body, { color: colors.textPrimary }]}
              value={body}
              onChangeText={t => {
                setBody(t);
                edit({ body: t });
              }}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder="Start writing…"
              placeholderTextColor={colors.textSecondary}
              cursorColor={PINK}
              selectionColor={PINK}
              accessibilityLabel="Note"
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {menuOpen && <NoteEditorPromptMenuBackdrop onPress={() => setMenuOpen(false)} />}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerArea: {
    // Above the backdrop and the editor so the prompt menu can drop down over them
    zIndex: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerSpacer: {
    flex: 1,
    minWidth: Spacing.sm,
  },
  // The kit Pill, but able to shrink so a long prompt is cut to one line.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    flexShrink: 1,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  context: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.sm,
    paddingVertical: 2,
    borderLeftWidth: 3,
  },
  contextText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
  },
  editor: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
    paddingVertical: Spacing.xs,
  },
  status: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.xs,
  },
  body: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: Math.round(Typography.body * 1.45),
    padding: 0,
  },
});
