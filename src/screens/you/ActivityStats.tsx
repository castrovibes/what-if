import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface } from '../../ui/surface';
import { Card, Dot, SectionLabel } from '../../ui/components';
import { Typography, Spacing } from '../../utils/deviceHelpers';

// TODO: real activity stats (needs usage tracking). Sample numbers until then, and
// labeled as such on screen.
const STATS = [
  { value: '24', label: 'Prompts explored', color: '#90dcff' },
  { value: '8', label: 'Days active', color: '#00db96' },
  { value: '4', label: 'Age groups used', color: '#e10086' },
  { value: '2', label: 'Prompts written', color: '#fdfb76' },
];

export const ActivityStats = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <>
      <SectionLabel>Your activity</SectionLabel>
      <View style={styles.grid}>
        {STATS.map(s => (
          <Card key={s.label} style={styles.tile}>
            <View style={styles.tileTop}>
              <Text style={[styles.value, { color: surface.accent }]}>{s.value}</Text>
              <Dot color={s.color} />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{s.label}</Text>
          </Card>
        ))}
      </View>
      <Text style={[styles.note, { color: colors.iconInactive }]}>
        Sample numbers for the beta. Activity tracking is coming soon.
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  tile: {
    width: '47.5%',
    padding: Spacing.md,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: Typography.title2,
    fontFamily: 'Geomini-Bold',
  },
  label: {
    marginTop: 4,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  note: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    marginTop: -Spacing.xs,
    marginLeft: 4,
  },
});
