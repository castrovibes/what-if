import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../../ui/components';
import { QuestionMark } from '../../ui/QuestionMark';
import { Typography, Spacing } from '../../utils/deviceHelpers';

/**
 * The card after the last prompt: the deck is finished. Offers another deck (a sheet of
 * age groups) or this one again from the top. Swiping it right, or the action row's
 * back button, returns to the last prompt.
 */
export const EndOfDeckCard = ({
  count,
  ageLabel,
  spaceName,
  accent,
  onChooseDeck,
  onStartOver,
}: {
  count: number;
  ageLabel: string | null;
  spaceName: string | null;
  accent: string;
  onChooseDeck: () => void;
  onStartOver: () => void;
}) => {
  const { colors } = useTheme();
  const where = [ageLabel ? `ages ${ageLabel}` : null, spaceName].filter(Boolean).join(' · ');
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <QuestionMark height={56} color={accent} opacity={0.4} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
        That’s the whole deck
      </Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        You’ve seen all {count} {count === 1 ? 'prompt' : 'prompts'}
        {where ? ` for ${where}` : ''}.
      </Text>
      <View style={styles.buttons}>
        <Button label="Pick another deck" icon="layers" onPress={onChooseDeck} />
        <Button label="Start this deck over" variant="secondary" icon="refresh-ccw" onPress={onStartOver} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mark: {
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.title2,
    fontFamily: 'Geomini-Bold',
    textAlign: 'center',
  },
  text: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 260,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
