/**
 * App.tsx - Application Entry Point
 *
 * This is the root component of the "What Could You Do?" application.
 * It sets up the navigation container and safe area provider for proper iOS integration.
 *
 * @module App
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { DbProvider } from './src/providers/DbProvider';
import { ActiveContextProvider } from './src/providers/ActiveContextProvider';
import { RootNavigator } from './src/app/RootNavigator';
import { AuthProvider } from './src/auth/AuthProvider';

/**
 * Status bar that follows the app's theme (which can override the device setting),
 * so it never shows dark text on a dark background or vice versa.
 */
const ThemedStatusBar = () => {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

/**
 * Root application component
 *
 * Wraps the app with SafeAreaProvider (notches, home indicators, etc.),
 * NavigationContainer for React Navigation, and the app-wide theme,
 * database, and active-context providers around the RootNavigator.
 *
 * @returns {JSX.Element} The root application component
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* App-wide providers (order matters: inner providers depend on outer ones) */}
        <ThemeProvider>
          <DbProvider>
            <ActiveContextProvider>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </ActiveContextProvider>
          </DbProvider>
          <ThemedStatusBar />
        </ThemeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
