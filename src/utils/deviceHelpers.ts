/**
 * Device Helpers - responsive type and spacing scales
 *
 * `Typography` and `Spacing` are what the app uses from here (every screen). They
 * are computed once from the window size at module load, which is safe because the
 * app is locked to portrait and doesn't support tablets (app.json); if either
 * changes, these need to become hooks on `useWindowDimensions()`.
 *
 * The breakpoints are iPhone widths, but Android phones fall into the same buckets.
 * For anything that depends on the notch / home indicator, use safe-area insets
 * (`useSafeAreaInsets()`), not the aspect-ratio guesses in this file.
 */

import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

/**
 * iPhone model categories based on screen dimensions
 */
export const DeviceType = {
  // Small devices: iPhone SE (1st-3rd gen), iPhone 8 and earlier
  SMALL: width < 375,

  // Standard devices: iPhone 12/13/14/15 mini, iPhone X/XS/11 Pro
  STANDARD: width >= 375 && width < 390,

  // Large devices: iPhone 12/13/14/15, iPhone XR/11
  LARGE: width >= 390 && width < 428,

  // Extra large devices: iPhone 12/13/14/15 Pro Max, iPhone 11 Pro Max
  XLARGE: width >= 428,
} as const;

/**
 * Check if device has notch/Dynamic Island
 * Devices with notch: iPhone X and newer (except SE models)
 * @deprecated A guess from the aspect ratio. Use `useSafeAreaInsets().top/bottom`.
 */
export const hasNotch = (): boolean => {
  if (Platform.OS !== 'ios') return false;

  // iPhone X and newer have taller screens (19.5:9 aspect ratio or taller)
  const aspectRatio = height / width;
  return aspectRatio > 1.9;
};

/**
 * Get responsive font size based on device width
 */
export const getFontSize = (baseSize: number): number => {
  const scale = width / 390; // Base on iPhone 12/13/14 width
  const newSize = baseSize * scale;

  // Limit scaling to prevent text from becoming too small or large
  return Math.round(Math.max(baseSize * 0.85, Math.min(newSize, baseSize * 1.15)));
};

/**
 * Get responsive spacing based on device width
 */
export const getSpacing = (baseSpacing: number): number => {
  const scale = width / 390;
  return Math.round(baseSpacing * scale);
};

/**
 * Get bottom tab bar height based on device
 * @deprecated MainTabNavigator sizes the bar from safe-area insets; keep in sync there.
 */
export const getTabBarHeight = (): number => {
  if (Platform.OS !== 'ios') return 60;
  return hasNotch() ? 88 : 60;
};

/**
 * Custom hook for device-aware safe area insets
 */
export const useDeviceSafeArea = () => {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top || 20, // Default status bar height
    bottom: insets.bottom || 0,
    left: insets.left || 0,
    right: insets.right || 0,
  };
};

/**
 * Get device-specific padding for bottom elements
 * @deprecated Use `useSafeAreaInsets().bottom`.
 */
export const getBottomPadding = (): number => {
  if (Platform.OS !== 'ios') return 16;
  return hasNotch() ? 34 : 16; // Extra padding for home indicator
};

/**
 * Device size categories for responsive design
 */
export const DeviceSize = {
  isSmall: width < 375,
  isStandard: width >= 375 && width < 390,
  isLarge: width >= 390 && width < 428,
  isXLarge: width >= 428,

  // Specific iPhone model detection (approximate)
  isSE: width === 320, // iPhone SE 1st gen
  isSE2: width === 375 && height === 667, // iPhone SE 2nd/3rd gen, 6/7/8
  isStandardNotch: width === 375 && hasNotch(), // iPhone X/XS/11 Pro
  isProMax: width >= 428, // Pro Max models
  isMini: width === 375 && height === 812, // iPhone 12/13 mini
} as const;

/**
 * Responsive value selector based on device size
 */
export const responsiveValue = <T,>(values: {
  small?: T;
  standard?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T => {
  if (DeviceSize.isXLarge && values.xlarge) return values.xlarge;
  if (DeviceSize.isLarge && values.large) return values.large;
  if (DeviceSize.isStandard && values.standard) return values.standard;
  if (DeviceSize.isSmall && values.small) return values.small;
  return values.default;
};

/**
 * Typography scale based on device size
 */
export const Typography = {
  // Display text (titles, headers)
  display: responsiveValue({
    small: 36,
    standard: 42,
    large: 48,
    xlarge: 52,
    default: 48,
  }),

  // Large titles
  largeTitle: responsiveValue({
    small: 28,
    standard: 32,
    large: 34,
    xlarge: 36,
    default: 34,
  }),

  // Titles
  title1: responsiveValue({
    small: 24,
    standard: 26,
    large: 28,
    xlarge: 30,
    default: 28,
  }),

  title2: responsiveValue({
    small: 20,
    standard: 22,
    large: 22,
    xlarge: 24,
    default: 22,
  }),

  title3: responsiveValue({
    small: 18,
    standard: 20,
    large: 20,
    xlarge: 22,
    default: 20,
  }),

  // Body text
  body: responsiveValue({
    small: 15,
    standard: 16,
    large: 17,
    xlarge: 18,
    default: 17,
  }),

  // Small text
  callout: responsiveValue({
    small: 14,
    standard: 15,
    large: 16,
    xlarge: 16,
    default: 16,
  }),

  subheadline: responsiveValue({
    small: 13,
    standard: 14,
    large: 15,
    xlarge: 15,
    default: 15,
  }),

  footnote: responsiveValue({
    small: 12,
    standard: 13,
    large: 13,
    xlarge: 13,
    default: 13,
  }),

  caption: responsiveValue({
    small: 11,
    standard: 12,
    large: 12,
    xlarge: 12,
    default: 12,
  }),
} as const;

/**
 * Spacing scale based on device size
 */
export const Spacing = {
  xs: getSpacing(4),
  sm: getSpacing(8),
  md: getSpacing(16),
  lg: getSpacing(24),
  xl: getSpacing(32),
  xxl: getSpacing(48),
} as const;

/**
 * Screen width breakpoints (iOS devices)
 */
export const Breakpoints = {
  // iPhone SE 1st gen (320px)
  xsmall: 320,

  // iPhone SE 2/3, 6/7/8 (375px)
  small: 375,

  // iPhone 12/13/14/15 standard (390px)
  medium: 390,

  // iPhone 12/13/14/15 Pro (393px)
  mediumPro: 393,

  // iPhone 12/13/14/15 Plus (428px)
  large: 428,

  // iPhone 14/15 Pro Max (430px)
  xlarge: 430,
} as const;

/**
 * Get screen dimensions
 */
export const Screen = {
  width,
  height,
  aspectRatio: height / width,
  isPortrait: height > width,
  isLandscape: width > height,
} as const;

/**
 * Helper to log device info for debugging
 */
export const logDeviceInfo = () => {
  console.log('📱 Device Info:', {
    width,
    height,
    hasNotch: hasNotch(),
    deviceType: DeviceSize,
    typography: Typography,
    spacing: Spacing,
  });
};

export default {
  DeviceType,
  DeviceSize,
  hasNotch,
  getFontSize,
  getSpacing,
  getTabBarHeight,
  getBottomPadding,
  responsiveValue,
  Typography,
  Spacing,
  Breakpoints,
  Screen,
  logDeviceInfo,
};
