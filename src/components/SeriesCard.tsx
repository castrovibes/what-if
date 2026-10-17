import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Module } from '../db/repositories/modules';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { findAgeGroup } from '../data/ageGroups';
import { Card, Dot } from '../ui/components';
import { useSurface } from '../ui/surface';

/** A conversation series, as listed on Explore and the Series screen. */
export const SeriesCard = ({ module: m, onPress }: { module: Module; onPress: () => void }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const accent = m.coverColor ?? findAgeGroup(m.ageGroup)?.bgColor ?? surface.accent;
  const ageDot = findAgeGroup(m.ageGroup)?.bgColor ?? accent;
  return (
    <Card accent={accent} onPress={onPress}>
      <View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{m.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{m.description}</Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Feather name="calendar" size={14} color={surface.accent} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {m.durationDays} prompts
            </Text>
          </View>
          <View style={styles.meta}>
            <Dot color={ageDot} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Ages {m.ageGroup}</Text>
          </View>
          <View style={styles.spacer} />
          <Feather name="chevron-right" size={18} color={colors.iconInactive} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
});
