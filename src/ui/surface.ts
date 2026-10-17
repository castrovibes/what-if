/**
 * Design tokens for the app's card-based look (introduced on the prompt screen).
 *
 * Use `useSurface()` for screen backgrounds, cards, borders and shadows instead of
 * reading `colors.bg` / `colors.cardBg` directly: dark mode here deliberately uses
 * lighter cards on a near-black backdrop with heavier shadows so cards read clearly.
 */
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { cardShadow } from '../styles/shadows';

export const PURPLE = '#49297e';
export const PURPLE_ON_DARK = '#a78bdb';
export const PINK = '#e10086';

export const CARD_RADIUS = 20;

const darkCardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.6,
  shadowRadius: 20,
  elevation: 12,
};

export type Surface = {
  screen: string;
  card: string;
  border: string;
  shadow: typeof cardShadow;
  /** Purple for titles, icons and outlines; lightened in dark mode for contrast. */
  accent: string;
};

const DARK_SURFACE: Surface = {
  screen: '#0b0b0d',
  card: '#2b2b31',
  border: '#3d3d45',
  shadow: darkCardShadow,
  accent: PURPLE_ON_DARK,
};

/**
 * Backgrounds, card colors, borders and shadows for the current theme. The two
 * results are stable objects, so they're safe to use as effect/memo dependencies
 * and don't re-render consumers on every call.
 */
export const useSurface = (): Surface => {
  const { colors, isDark } = useTheme();
  return useMemo(
    () =>
      isDark
        ? DARK_SURFACE
        : {
            screen: colors.bgSubtle,
            card: colors.cardBg,
            border: colors.border,
            shadow: cardShadow,
            accent: PURPLE,
          },
    [isDark, colors],
  );
};
