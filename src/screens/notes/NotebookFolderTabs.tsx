import React, { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  ScrollViewInstance,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { Spacing } from '../../utils/deviceHelpers';
import { ui } from '../../ui/components';
import { useSurface, PINK } from '../../ui/surface';
import { NoteFolder } from '../../db/repositories/notes';

/**
 * The Notebook's folder tabs: a horizontally scrolling strip of pills, then "+ Folder".
 * Drawn like the kit's `Pill` (same styles), which has no long-press; long-press opens
 * the folder's Rename / Delete sheet. The active tab is kept scrolled into view.
 */
export const NotebookFolderTabs = ({
  folders,
  activeId,
  onSelect,
  onLongPress,
  onAdd,
}: {
  folders: NoteFolder[];
  activeId: string;
  onSelect: (folder: NoteFolder) => void;
  onLongPress: (folder: NoteFolder) => void;
  onAdd: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const scroll = useRef<ScrollViewInstance>(null);
  const stripWidth = useRef(0);
  const tabs = useRef<Record<string, { x: number; width: number }>>({});

  // Centers the tab where it can, so its neighbors show on both sides. Reads only refs.
  const reveal = useCallback((id: string, animated: boolean) => {
    const tab = tabs.current[id];
    if (!tab) return;
    const x = Math.max(0, tab.x - (stripWidth.current - tab.width) / 2);
    scroll.current?.scrollTo({ x, animated });
  }, []);

  useEffect(() => {
    reveal(activeId, true);
  }, [activeId, reveal]);

  const onTabLayout = (id: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabs.current[id] = { x, width };
    // A tab laid out after it was chosen (a new folder, or the first render).
    if (id === activeId) reveal(id, false);
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
      onLayout={e => (stripWidth.current = e.nativeEvent.layout.width)}
    >
      {folders.map(folder => {
        const active = folder.id === activeId;
        return (
          <TouchableOpacity
            key={folder.id}
            onLayout={onTabLayout(folder.id)}
            onPress={() => onSelect(folder)}
            onLongPress={() => onLongPress(folder)}
            activeOpacity={0.85}
            style={[
              ui.pill,
              {
                backgroundColor: active ? PINK : surface.card,
                borderColor: active ? PINK : surface.border,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityHint="Long-press to rename or delete the folder."
          >
            <Text
              style={[ui.pillText, styles.label, { color: active ? '#fff' : colors.textPrimary }]}
              numberOfLines={1}
            >
              {folder.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.85}
        style={[ui.pill, styles.add, { borderColor: surface.border }]}
        accessibilityRole="button"
        accessibilityLabel="New folder"
      >
        <Feather name="plus" size={14} color={colors.iconDefault} />
        <Text style={[ui.pillText, { color: colors.textSecondary }]}>Folder</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexGrow: 0,
  },
  content: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  // Names are capped at 30 characters; this keeps a long one from filling the strip.
  label: {
    maxWidth: 220,
  },
  // Dashed and unfilled, so it reads as an action rather than another folder.
  add: {
    borderStyle: 'dashed',
  },
});
