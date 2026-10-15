import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSurface, PINK } from '../ui/surface';
import { Typography, Spacing } from '../utils/deviceHelpers';

// Banner for safety-sensitive screens that haven't been reviewed by a clinician.
// Defined in PROTOTYPE_INTEGRATION_PLAN.md §7 as a hard release gate — these
// screens cannot ship to end users until removed.
export const PreReleaseBanner = () => {
  const surface = useSurface();
  return (
    <View style={[styles.banner, { backgroundColor: surface.card, borderColor: PINK }]}>
      <Feather name="alert-triangle" size={14} color={PINK} />
      <Text style={[styles.text, { color: PINK }]}>PRE-RELEASE: Pending clinical review</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: Spacing.md,
  },
  text: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
