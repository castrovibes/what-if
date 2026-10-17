import React, { useEffect, useState } from 'react';
import { useSyncVersion } from '../sync/events';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { ModuleRepo, Module, ModuleStep } from '../db/repositories/modules';
import { PromptRepo } from '../db/repositories/prompts';
import { Prompt } from '../db/types';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { findAgeGroup } from '../data/ageGroups';
import { Screen, ScreenHeader, ScreenScroll, Card, Dot } from '../ui/components';
import { useSurface, PINK } from '../ui/surface';

export const ModuleDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PromptsStackParamList, 'ModuleDetail'>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { activeContext } = useActiveContext();
  const moduleId = route.params.moduleId;

  const [module, setModule] = useState<Module | null>(null);
  const [steps, setSteps] = useState<(ModuleStep & { prompt: Prompt | null })[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const syncVersion = useSyncVersion();
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
  }, [moduleId, activeContext.id, syncVersion]);

  // Tapping the circle checks a step off, or unchecks it.
  const toggleStep = async (promptId: string) => {
    const wasDone = completed.has(promptId);
    setCompleted(prev => {
      const next = new Set(prev);
      if (wasDone) next.delete(promptId);
      else next.add(promptId);
      return next;
    });
    if (wasDone) await ModuleRepo.markIncomplete(activeContext.id, moduleId, promptId);
    else await ModuleRepo.markComplete(activeContext.id, moduleId, promptId);
  };

  if (!module) return null;

  const completedCount = steps.filter(s => completed.has(s.promptId)).length;
  const accent = module.coverColor ?? findAgeGroup(module.ageGroup)?.bgColor ?? surface.accent;
  const ageDot = findAgeGroup(module.ageGroup)?.bgColor ?? accent;
  const progress = steps.length > 0 ? completedCount / steps.length : 0;

  return (
    <Screen>
      <ScreenHeader title="Conversation Series" onBack={() => navigation.goBack()} />
      {/* Tighter than other screens so the steps get more of the width. */}
      <ScreenScroll contentStyle={localStyles.content}>
        <Card accent={accent} padded={false} style={localStyles.cardBody}>
          <View>
            {module.ageGroup && (
              <View style={localStyles.meta}>
                <Dot color={ageDot} />
                <Text style={[localStyles.metaText, { color: colors.textSecondary }]}>
                  Ages {module.ageGroup}
                </Text>
              </View>
            )}
            <Text style={[localStyles.coverTitle, { color: colors.textPrimary }]}>{module.title}</Text>
            <Text style={[localStyles.coverDescription, { color: colors.textSecondary }]}>
              {module.description}
            </Text>
            <View style={[localStyles.progressTrack, { backgroundColor: surface.border }]}>
              <View
                style={[
                  localStyles.progressFill,
                  { backgroundColor: PINK, width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={[localStyles.coverProgress, { color: colors.textSecondary }]}>
              {completedCount} of {steps.length} complete
            </Text>
          </View>
        </Card>

        {steps.map(s => {
          const done = completed.has(s.promptId);
          return (
            <Card key={s.promptId} padded={false} style={localStyles.cardBody}>
              <View style={localStyles.stepHeader}>
                <View style={[localStyles.stepPill, { borderColor: surface.border }]}>
                  <Text style={[localStyles.stepNumber, { color: colors.textSecondary }]}>
                    STEP {s.stepNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleStep(s.promptId)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`Step ${s.stepNumber} done`}
                >
                  <Feather
                    name={done ? 'check-circle' : 'circle'}
                    size={22}
                    color={done ? PINK : colors.iconInactive}
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
            </Card>
          );
        })}
      </ScreenScroll>
    </Screen>
  );
};

const localStyles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
  },
  cardBody: {
    padding: Spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  coverTitle: {
    fontSize: Typography.title1,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    lineHeight: Math.round(Typography.title1 * 1.25),
    marginBottom: Spacing.sm,
  },
  coverDescription: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  coverProgress: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepNumber: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
  },
  stepIntro: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: Spacing.sm,
  },
  stepPrompt: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: Math.round(Typography.title3 * 1.3),
    marginBottom: Spacing.sm,
  },
  stepOutro: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
    lineHeight: 21,
  },
});
