import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface } from '../ui/surface';
import { Button } from '../ui/components';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { OnboardingStackParamList } from '../navigation/types';

export const WelcomeScreen = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const [g0, g1, g2] = colors.gradientStops;

  return (
    <LinearGradient colors={[g0, g1, g2]} style={local.fill}>
      <SafeAreaView style={local.fill} edges={['top', 'bottom']}>
        {/* Only when replayed from Settings; on first launch Welcome is the root. */}
        {navigation.canGoBack() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityLabel="Back"
            style={local.back}
          >
            <Feather name="chevron-left" size={26} color={surface.accent} />
          </TouchableOpacity>
        )}
        <View style={local.content}>
          <Text style={[local.mark, { color: surface.accent }]}>?</Text>
          <Text style={[local.title, { color: surface.accent }]}>What Could You Do?</Text>
          <Text style={[local.subtitle, { color: colors.textSecondary }]}>
            Foster meaningful conversations with children through age-appropriate prompts that spark
            critical thinking and ethical reasoning
          </Text>
        </View>

        <View style={local.actions}>
          <Button label="Get Started" onPress={() => navigation.navigate('WelcomeTutorial')} />
          <Text style={[local.footer, { color: colors.textSecondary }]}>
            For Parents, Educators & Therapists
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const local = StyleSheet.create({
  fill: {
    flex: 1,
  },
  back: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  mark: {
    fontSize: 96,
    lineHeight: 110,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    opacity: 0.15,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.largeTitle,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 400,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  footer: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
