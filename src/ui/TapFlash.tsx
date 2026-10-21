import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../providers/ThemeProvider';

const TAP_FLASH_IN_MS = 90;
const TAP_FLASH_OUT_MS = 380;
const TAP_FLASH_LIGHT = 'rgba(0, 0, 0, 0.04)'; // a slightly darker shade in light mode
const TAP_FLASH_DARK = 'rgba(255, 255, 255, 0.06)'; // slightly lighter in dark mode

/**
 * Tap feedback for the page-turn zones (the prompt deck and the Welcome guide): a soft
 * gradient that flashes in from the tapped side of the screen, strongest at the edge
 * and fading out toward the card.
 */
export const useTapFlash = () => {
  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const flash = (side: 'left' | 'right') => {
    const value = side === 'left' ? left : right;
    value.value = withSequence(
      withTiming(1, { duration: TAP_FLASH_IN_MS, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: TAP_FLASH_OUT_MS, easing: Easing.in(Easing.quad) }),
    );
  };
  return { left, right, flash };
};

/** One side's flash. Full screen height so it has no hard top or bottom edge. */
export const TapFlash = ({ side, value }: { side: 'left' | 'right'; value: SharedValue<number> }) => {
  const { isDark } = useTheme();
  const style = useAnimatedStyle(() => ({ opacity: value.value }));
  const tint = isDark ? TAP_FLASH_DARK : TAP_FLASH_LIGHT;
  const clear = isDark ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)';
  // Midpoint of an eased falloff, so the glow hugs the edge rather than fading evenly.
  const mid = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.0125)';
  const isLeft = side === 'left';
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flash, isLeft ? styles.left : styles.right, style]}
    >
      <LinearGradient
        colors={isLeft ? [tint, mid, clear] : [clear, mid, tint]}
        locations={isLeft ? [0, 0.45, 1] : [0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
});
