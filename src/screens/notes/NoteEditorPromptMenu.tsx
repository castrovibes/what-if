import React from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK, CARD_RADIUS } from '../../ui/surface';
import { Dot } from '../../ui/components';
import { findAgeGroup } from '../../data/ageGroups';
import { PlayedPrompt } from '../../db/repositories/promptPlays';
import { Typography, Spacing } from '../../utils/deviceHelpers';

/**
 * What the note is about: "General note" or one of the recently played prompts. Drops
 * down from the prompt pill in the editor's header (the deck's AgeMenu pattern).
 */
export const NoteEditorPromptMenu = ({
  prompts,
  selectedId,
  onSelect,
}: {
  /** Recently played, plus the note's own prompt at the top if it isn't recent. */
  prompts: PlayedPrompt[];
  selectedId: string | null;
  onSelect: (promptId: string | null) => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const { height } = useWindowDimensions();
  const divider = { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: surface.border };

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutUp.duration(120)}
      style={[
        styles.menu,
        { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
      ]}
    >
      <ScrollView style={{ maxHeight: height * 0.6 }} bounces={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          WHAT’S THIS NOTE ABOUT?
        </Text>
        <TouchableOpacity
          onPress={() => onSelect(null)}
          style={[styles.option, divider]}
          accessibilityRole="button"
          accessibilityLabel="General note"
          accessibilityState={{ selected: selectedId === null }}
        >
          <Feather name="edit-3" size={14} color={colors.iconDefault} />
          <Text style={[styles.optionText, { color: colors.textPrimary }]}>General note</Text>
          {selectedId === null && <Feather name="check" size={18} color={PINK} />}
        </TouchableOpacity>

        <Text style={[styles.label, styles.sectionLabel, { color: colors.textSecondary }]}>
          RECENTLY PLAYED
        </Text>
        {prompts.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Prompts you play in the deck show up here.
          </Text>
        )}
        {prompts.map((p, i) => (
          <TouchableOpacity
            key={p.promptId}
            onPress={() => onSelect(p.promptId)}
            style={[styles.option, i < prompts.length - 1 && divider]}
            accessibilityRole="button"
            accessibilityLabel={p.text}
            accessibilityState={{ selected: p.promptId === selectedId }}
          >
            <Dot color={findAgeGroup(p.ageGroup)?.bgColor} size={12} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]} numberOfLines={2}>
              {p.text}
            </Text>
            {p.promptId === selectedId && <Feather name="check" size={18} color={PINK} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

/** Tap outside the menu to close it; sits under the header and the menu. */
export const NoteEditorPromptMenuBackdrop = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    style={[StyleSheet.absoluteFill, styles.backdrop]}
    onPress={onPress}
    accessibilityLabel="Close prompt menu"
  />
);

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: '100%',
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  label: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sectionLabel: {
    paddingTop: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
  },
  empty: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  backdrop: {
    zIndex: 9,
    elevation: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
});
