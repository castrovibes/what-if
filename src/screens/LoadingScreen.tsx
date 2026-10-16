import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface } from '../ui/surface';
import { Typography, Spacing } from '../utils/deviceHelpers';

// Shown before fonts and providers are ready, so it only relies on ThemeProvider and
// falls back to the system font until Inter has loaded.
export const LoadingScreen = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const fontFamily = Font.isLoaded('Inter-SemiBold') ? 'Inter-SemiBold' : undefined;

  return (
    <View style={[local.container, { backgroundColor: surface.screen }]}>
      <Text style={[local.mark, { color: surface.accent, fontFamily }]}>?</Text>
      <Text style={[local.title, { color: colors.textPrimary, fontFamily }]}>What If?</Text>
    </View>
  );
};

const local = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  mark: {
    fontSize: 96,
    lineHeight: 110,
    fontWeight: '700',
    opacity: 0.15,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.title2,
    fontWeight: '700',
    textAlign: 'center',
  },
});
