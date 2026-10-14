import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { ModuleRepo, Module, ModuleStep } from '../db/repositories/modules';
import { PromptRepo } from '../db/repositories/prompts';
import { Prompt } from '../db/types';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

export const ModuleDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PromptsStackParamList, 'ModuleDetail'>>();
  const { colors } = useTheme();
  const { activeContext } = useActiveContext();
  const moduleId = route.params.moduleId;

  const [module, setModule] = useState<Module | null>(null);
  const [steps, setSteps] = useState<Array<ModuleStep & { prompt: Prompt | null }>>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const m = await ModuleRepo.findById(moduleId);
      setModule(m);
      const rawSteps = await ModuleRepo.stepsForModule(moduleId);
      const enriched = await Promise.all(
        rawSteps.map(async s => {
          const all = await PromptRepo.findFiltered({});
          const prompt = all.find(p => p.id === s.promptId) ?? null;
          return { ...s, prompt };
        })
      );
      setSteps(enriched);
      const done = await ModuleRepo.completedSteps(activeContext.id, moduleId);
      setCompleted(done);
    })();
  }, [moduleId, activeContext.id]);

  const toggleStep = async (promptId: string) => {
    if (completed.has(promptId)) return;
    await ModuleRepo.markComplete(activeContext.id, moduleId, promptId);
    setCompleted(prev => new Set(prev).add(promptId));
  };

  if (!module) return null;

  const completedCount = steps.filter(s => completed.has(s.promptId)).length;

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRow}>
          <Feather name="chevron-left" size={20} color="#e10086" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={[localStyles.cover, { backgroundColor: module.coverColor ?? '#49297e' }]}>
          <Text style={localStyles.coverTitle}>{module.title.toUpperCase()}</Text>
          <Text style={localStyles.coverDescription}>{module.description}</Text>
          <Text style={localStyles.coverProgress}>
            {completedCount} of {steps.length} complete
          </Text>
        </View>

        {steps.map(s => {
          const done = completed.has(s.promptId);
          return (
            <View key={s.promptId} style={[localStyles.stepCard, { backgroundColor: colors.cardBg }]}>
              <View style={localStyles.stepHeader}>
                <Text style={[localStyles.stepNumber, { color: colors.textSecondary }]}>
                  STEP {s.stepNumber}
                </Text>
                <TouchableOpacity onPress={() => toggleStep(s.promptId)}>
                  <Feather
                    name={done ? 'check-circle' : 'circle'}
                    size={22}
                    color={done ? '#00db96' : colors.iconInactive}
                  />
                </TouchableOpacity>
              </View>
              {s.introText && (
                <Text style={[localStyles.stepIntro, { color: colors.textSecondary }]}>
                  {s.introText}
                </Text>
              )}
              <Text style={[localStyles.stepPrompt, { color: colors.textPrimary }]}>
                {s.prompt?.text ?? '[prompt unavailable]'}
              </Text>
              {s.outroText && (
                <Text style={[localStyles.stepOutro, { color: colors.textSecondary }]}>
                  After: {s.outroText}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  cover: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  coverTitle: {
    fontSize: Typography.title1,
    fontFamily: 'Barrio-Regular',
    color: '#49297e',
    marginBottom: Spacing.sm,
  },
  coverDescription: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    color: '#49297e',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  coverProgress: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#49297e',
    letterSpacing: 1,
  },
  stepCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  stepIntro: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  stepPrompt: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  stepOutro: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
  },
});
