/**
 * Theme colors. The neutrals are tinted toward the brand purple (#49297e, hue ~262)
 * rather than a stock gray scale, so screens, borders and secondary text belong to the
 * app even where no brand color appears. Backgrounds, cards and borders should be read
 * through `useSurface()` (src/ui/surface.ts), which adds shadows and the accent.
 */
export const themes = {
  light: {
    bg: '#ffffff',
    bgSubtle: '#f6f4fa',
    bgMuted: '#eeeaf4',
    bgOverlay: 'rgba(246, 244, 250, 0.78)',
    textPrimary: '#1b1626',
    textSecondary: '#5a5469',
    border: '#e4dfec',
    iconDefault: '#6d6680',
    iconInactive: '#a39db3',
    cardBg: '#ffffff',
    tintBlue: '#e8f6ff',
    tintGreen: '#d6f9ed',
    tintPurple: '#ece6f4',
    tintPink: '#fce0f0',
    tipsBg: '#ece6f4',
    tipsBoxBg: '#f6f4fa',
    tipsBoxBorder: 'rgba(73, 41, 126, 0.2)',
    switchTrackFalse: '#d3cedd',
    tabBarBg: '#f6f4fa',
    tabBarBorder: '#e4dfec',
    filterInactiveBg: '#eeeaf4',
    gradientStops: ['#f8f4ff', '#ece6f4', '#fce0f0'] as string[],
  },
  dark: {
    // Near-black with a purple cast; cards sit raised and lighter on it (see surface.ts).
    bg: '#0d0b13',
    bgSubtle: '#0d0b13',
    bgMuted: '#342f40',
    bgOverlay: 'rgba(13, 11, 19, 0.85)',
    textPrimary: '#f2f0f6',
    textSecondary: '#a9a3b8',
    border: '#3e3949',
    iconDefault: '#a9a3b8',
    iconInactive: '#6c667c',
    cardBg: '#2a2634',
    tintBlue: '#1a2a3a',
    tintGreen: '#1a2e28',
    tintPurple: '#2a1e3a',
    tintPink: '#3a1a2a',
    tipsBg: '#2a1e3a',
    tipsBoxBg: '#2a2634',
    tipsBoxBorder: 'rgba(167, 139, 219, 0.35)',
    switchTrackFalse: '#4a4457',
    tabBarBg: '#0d0b13',
    tabBarBorder: '#3e3949',
    filterInactiveBg: '#342f40',
    gradientStops: ['#1a1025', '#2a1e3a', '#3a1a2a'] as string[],
  },
} as const;

export type ThemeColors = Omit<{ [K in keyof typeof themes.light]: string }, 'gradientStops'> & {
  gradientStops: string[];
};
