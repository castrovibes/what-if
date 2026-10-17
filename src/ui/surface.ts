/**
 * Design tokens for the app's card-based look (introduced on the prompt screen).
 *
 * Use `useSurface()` for screen backgrounds, cards, borders and shadows instead of
 * reading `colors.bg` / `colors.cardBg` directly: dark mode here deliberately uses
 * lighter cards on a near-black backdrop with heavier shadows so cards read clearly.
 */
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

export const useSurface = () => {
  const { colors, isDark } = useTheme();
  return isDark
    ? {
        screen: '#0b0b0d',
        card: '#2b2b31',
        border: '#3d3d45',
        shadow: darkCardShadow,
        /** Purple for titles, icons and outlines; lightened in dark mode for contrast. */
        accent: PURPLE_ON_DARK,
      }
    : {
        screen: colors.bgSubtle,
        card: colors.cardBg,
        border: colors.border,
        shadow: cardShadow,
        accent: PURPLE,
      };
};
