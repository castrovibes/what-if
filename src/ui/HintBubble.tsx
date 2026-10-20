import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK, INPUT_RADIUS } from './surface';

type IconName = keyof typeof Feather.glyphMap;

/**
 * A one-time, in-place hint: a small card that floats over the screen (it never shifts
 * the layout under it) and goes away when tapped or when the thing it points at is
 * used. Pair with `useOneTimeHint`.
 */
export const HintBubble = ({
  icon,
  text,
  onDismiss,
  bottom,
}: {
  icon: IconName;
  text: string;
  onDismiss: () => void;
  /** Distance from the bottom of the containing screen. */
  bottom: number;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(260)}
      exiting={FadeOut.duration(160)}
      style={[styles.dock, { bottom }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onDismiss}
        style={[styles.bubble, { backgroundColor: surface.card, borderColor: surface.accent, ...surface.shadow }]}
        accessibilityRole="button"
        accessibilityLabel={`${text} Dismiss hint`}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.tintPurple }]}>
          <Feather name={icon} size={16} color={surface.accent} />
        </View>
        <Text style={[styles.text, { color: colors.textPrimary }]}>{text}</Text>
        <Text style={styles.gotIt}>Got it</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: INPUT_RADIUS,
    borderWidth: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
  },
  gotIt: {
    color: PINK,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
  },
});
