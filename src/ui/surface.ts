/**
 * Design tokens for the app's card-based look (introduced on the prompt screen).
 *
 * Use `useSurface()` for screen backgrounds, cards, borders and shadows instead of
 * reading `colors.bg` / `colors.cardBg` directly. Both themes come from
 * src/theme/themes.ts; dark mode deliberately uses lighter cards on a near-black
 * backdrop with heavier shadows so cards read clearly. The tab bar and navigation
 * chrome read these same tokens, so every background in a theme matches.
 */
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { cardShadow } from '../styles/shadows';

export const PURPLE = '#49297e';
export const PURPLE_ON_DARK = '#a78bdb';
export const PINK = '#e10086';

/** Cards, bottom sheets, menus and plan cards. */
export const CARD_RADIUS = 20;
/** Text fields, buttons, banners and other controls inside a card. */
export const INPUT_RADIUS = 14;

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

/**
 * Backgrounds, card colors, borders and shadows for the current theme. The result is
 * a stable object per theme, so it's safe to use as an effect/memo dependency and
 * doesn't re-render consumers on every call.
 */
export const useSurface = (): Surface => {
  const { colors, isDark } = useTheme();
  return useMemo(
    () => ({
      screen: colors.bgSubtle,
      card: colors.cardBg,
      border: colors.border,
      shadow: isDark ? darkCardShadow : cardShadow,
      accent: isDark ? PURPLE_ON_DARK : PURPLE,
    }),
    [isDark, colors],
  );
};
