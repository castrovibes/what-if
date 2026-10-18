/**
 * In-app toast: a short message that rises above the tab bar and fades out, in the
 * app's own visual language (a native Alert is kept only for destructive confirms).
 *
 *   toast.show({ message: 'Saved to My Prompts', icon: 'check' });
 *   toast.show({ message: 'Saved', action: { label: 'Play', onPress } });
 *   toast.beta('Email preferences');   // "… isn't in the beta yet."
 *
 * `toast` is a module-level API so repositories, navigation helpers and screens can
 * all use it without a hook. `ToastHost` (mounted once in App.tsx) draws it.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK, INPUT_RADIUS } from './surface';
import { tabBarOverlayHeight } from '../navigation/tabBarInset';

type IconName = keyof typeof Feather.glyphMap;

export type ToastOptions = {
  message: string;
  icon?: IconName;
  /** How long it stays, in ms. Longer when there's an action to tap. */
  duration?: number;
  action?: { label: string; onPress: () => void };
};

type ActiveToast = ToastOptions & { id: number };

const DEFAULT_MS = 2400;
const WITH_ACTION_MS = 4500;

let nextId = 1;
let listener: ((t: ActiveToast | null) => void) | null = null;

export const toast = {
  show(options: ToastOptions) {
    listener?.({ ...options, id: nextId++ });
  },
  hide() {
    listener?.(null);
  },
  /** For controls that aren't built yet: tells testers it's expected, not broken. */
  beta(feature: string) {
    toast.show({ message: `${feature} isn't in the beta yet.`, icon: 'clock' });
  },
};

/** Draws the current toast. Mount once, above the navigator. */
export const ToastHost = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ActiveToast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = setCurrent;
    return () => {
      if (listener === setCurrent) listener = null;
    };
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!current) return;
    const ms = current.duration ?? (current.action ? WITH_ACTION_MS : DEFAULT_MS);
    timer.current = setTimeout(() => setCurrent(null), ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [current]);

  if (!current) return null;
  const { id, message, icon, action } = current;

  return (
    <View
      // Just above the floating tab bar (the host sits outside the tabs, so it uses the
      // bar's geometry directly rather than the inset hook).
      style={[styles.dock, { bottom: tabBarOverlayHeight(insets.bottom) }]}
      pointerEvents="box-none"
    >
      <Animated.View
        key={id}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        style={[
          styles.toast,
          { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
        ]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        {icon && <Feather name={icon} size={16} color={surface.accent} />}
        <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            onPress={() => {
              setCurrent(null);
              action.onPress();
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.action}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: INPUT_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  message: {
    flexShrink: 1,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  action: {
    color: PINK,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-SemiBold',
    paddingLeft: Spacing.xs,
  },
});
