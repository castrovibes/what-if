import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface } from '../ui/surface';
import { Button } from '../ui/components';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { hideSplash } from '../app/splash';

/**
 * Shown when the app can't start (the database failed to open or migrate, or a
 * startup step threw). It only relies on ThemeProvider, like LoadingScreen, so it
 * can render no matter which later provider failed.
 */
export const StartupErrorScreen = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  /** Shown under the title; keep it plain, this reaches the user. */
  message: string;
  /** When given, shows a "Try again" button. */
  onRetry?: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={[styles.container, { backgroundColor: surface.screen }]} onLayout={hideSplash}>
      <View
        style={[styles.card, { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow }]}
      >
        <Feather name="alert-circle" size={36} color={surface.accent} />
        <Text style={[styles.title, { color: surface.accent }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        {onRetry && (
          <View style={styles.actions}>
            <Button label="Try again" icon="refresh-cw" onPress={onRetry} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 23,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
});
