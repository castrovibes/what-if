import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface } from '../ui/surface';
import { Screen, ScreenHeader, ScreenScroll, Card, Button } from '../ui/components';
import { Typography, Spacing } from '../utils/deviceHelpers';

const STEPS = [
  {
    title: 'Pick an Age Group',
    description:
      "Tap the age pill at the top of the Prompts screen and choose the range that best matches the child you're talking with. Prompts are designed to be developmentally appropriate.",
  },
  {
    title: 'Read the Prompt Together',
    description:
      'Share the "What if..." scenario with the child. Use the audio button if helpful. Take your time—there\'s no rush.',
  },
  {
    title: 'Listen and Explore Together',
    description:
      'Ask open-ended questions. There are no right or wrong answers. Focus on their thinking process, not finding the "correct" solution.',
  },
  {
    title: 'Discuss Multiple Possibilities',
    description:
      'Encourage thinking about different options. What might happen with each choice? How might others feel? What values matter here?',
  },
];

/** A numbered step: small accent circle beside a title and description. */
const StepCard = ({ n, title, description }: { n: number; title: string; description: string }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <Card>
      <View style={local.row}>
        <View style={[local.badge, { backgroundColor: surface.accent }]}>
          <Text style={local.badgeText}>{n}</Text>
        </View>
        <View style={local.text}>
          <Text style={[local.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[local.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
    </Card>
  );
};

export const HowToUseScreen = ({ onComplete }: { onComplete: () => void }) => {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        title="How to Use This App"
        subtitle="A guide to meaningful conversations"
        onBack={() => navigation.goBack()}
      />
      <ScreenScroll>
        {STEPS.map((step, i) => (
          <StepCard key={step.title} n={i + 1} title={step.title} description={step.description} />
        ))}
        <View style={local.cta}>
          <Button label="Let's Get Started" onPress={handleGetStarted} />
        </View>
      </ScreenScroll>
    </Screen>
  );
};

const local = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
  },
  cta: {
    marginTop: Spacing.sm,
  },
});
