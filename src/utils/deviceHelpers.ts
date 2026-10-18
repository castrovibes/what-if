/**
 * Device Helpers - responsive type and spacing scales
 *
 * `Typography` and `Spacing` are what the app uses from here (every screen). They
 * are computed once from the window size at module load, which is safe because the
 * app is locked to portrait and doesn't support tablets (app.json); if either
 * changes, these need to become hooks on `useWindowDimensions()`.
 *
 * The breakpoints are iPhone widths, but Android phones fall into the same buckets.
 * Anything that depends on the notch / home indicator uses safe-area insets
 * (`useSafeAreaInsets()`); nothing here guesses at the device model.
 */

import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Width buckets: small (iPhone SE and earlier), standard (mini / X-size), large
// (standard iPhones), xlarge (Plus / Pro Max).
const size =
  width < 375 ? 'small' : width < 390 ? 'standard' : width < 428 ? 'large' : 'xlarge';

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
 * Responsive value selector based on device size
 */
export const responsiveValue = <T,>(values: {
  small?: T;
  standard?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T => values[size] ?? values.default;

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
