import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK, CARD_RADIUS } from '../../ui/surface';
import { Dot } from '../../ui/components';
import { ageGroups, AgeGroupId } from '../../data/ageGroups';
import { Typography, Spacing } from '../../utils/deviceHelpers';

const ageLabel = (label: string) => label.replace('-', ' – ');

/** Age picker that drops down from the age pill, over the card. */
export const AgeMenu = ({
  selectedAge,
  onSelect,
}: {
  selectedAge: AgeGroupId | null;
  onSelect: (id: AgeGroupId) => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutUp.duration(120)}
      style={[
        styles.ageMenu,
        { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
      ]}
    >
      <Text style={[styles.ageMenuTitle, { color: colors.textSecondary }]}>
        WHO ARE YOU TALKING WITH?
      </Text>
      {ageGroups.map((g, i) => (
        <TouchableOpacity
          key={g.id}
          onPress={() => onSelect(g.id)}
          style={[
            styles.ageOption,
            i < ageGroups.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: surface.border,
            },
          ]}
          accessibilityLabel={`Ages ${g.label}`}
        >
          <Dot color={g.bgColor} size={12} />
          <Text style={[styles.ageOptionText, { color: colors.textPrimary }]}>
            {ageLabel(g.label)}
          </Text>
          {g.id === selectedAge && <Feather name="check" size={18} color={PINK} />}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

/** Tap outside the age picker to close it; sits under the pills and menu. */
export const AgeMenuBackdrop = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    style={[StyleSheet.absoluteFill, styles.menuBackdrop]}
    onPress={onPress}
    accessibilityLabel="Close age picker"
  />
);

/** The age options on the card under the title card (no age group set yet). */
export const AgePickCard = ({ onSelect }: { onSelect: (id: AgeGroupId) => void }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={styles.agePickCard}>
      <Text style={[styles.agePickTitle, { color: colors.textSecondary }]}>
        WHO ARE YOU TALKING WITH?
      </Text>
      {ageGroups.map((g, i) => (
        <TouchableOpacity
          key={g.id}
          onPress={() => onSelect(g.id)}
          style={[
            styles.agePickOption,
            i < ageGroups.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: surface.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Ages ${g.label}`}
        >
          <Dot color={g.bgColor} size={14} />
          <Text style={[styles.agePickText, { color: colors.textPrimary }]}>
            {ageLabel(g.label)}
          </Text>
          <Feather name="chevron-right" size={18} color={colors.iconInactive} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  ageMenu: {
    position: 'absolute',
    top: 40,
    left: Spacing.lg,
    width: 270,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  ageMenuTitle: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  ageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  ageOptionText: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  menuBackdrop: {
    zIndex: 9,
    elevation: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  agePickCard: {
    flex: 1,
  },
  agePickTitle: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  agePickOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  agePickText: {
    flex: 1,
    fontSize: Typography.title3,
    fontFamily: 'Geomini-SemiBold',
  },
});
