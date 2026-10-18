import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeColors } from './themes';
import { PreferenceSync } from '../sync/preferenceSync';

const STORAGE_KEY = 'darkMode';

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  toggleDarkMode: () => void;
  /** The user's explicit choice, or null when following the device. */
  darkModePreference: boolean | null;
  /** Applies a saved choice (e.g. from the account) without syncing it back. */
  applyDarkModePreference: (value: boolean | null) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: themes.light,
  toggleDarkMode: () => {},
  darkModePreference: null,
  applyDarkModePreference: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');
  const [hasUserPreference, setHasUserPreference] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'true') {
        setIsDark(true);
        setHasUserPreference(true);
      } else if (val === 'false') {
        setIsDark(false);
        setHasUserPreference(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hasUserPreference) {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemScheme, hasUserPreference]);

  const toggleDarkMode = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    setHasUserPreference(true);
    AsyncStorage.setItem(STORAGE_KEY, String(next));
    PreferenceSync.push({ darkMode: next });
  }, [isDark]);

  const applyDarkModePreference = useCallback(
    (value: boolean | null) => {
      if (value === null) {
        setHasUserPreference(false);
        setIsDark(systemScheme === 'dark');
        AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        setHasUserPreference(true);
        setIsDark(value);
        AsyncStorage.setItem(STORAGE_KEY, String(value));
      }
    },
    [systemScheme],
  );

  // One stable value per (isDark, preference) pair, so consumers only re-render when
  // the theme actually changes, not whenever this provider does.
  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      colors: isDark ? themes.dark : themes.light,
      toggleDarkMode,
      darkModePreference: hasUserPreference ? isDark : null,
      applyDarkModePreference,
    }),
    [isDark, hasUserPreference, toggleDarkMode, applyDarkModePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
