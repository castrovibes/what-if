import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { MadLibsRepo, MadLibsTemplate, applyTemplate } from '../db/repositories/madLibs';
import { FeatureFlags } from '../data/featureFlags';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { findAgeGroup, AgeGroupId } from '../data/ageGroups';
import { UserPromptRepo, newUserPromptId } from '../db/repositories/userPrompts';
import { playMyPromptsInDeck } from '../navigation/deckLinks';
import {
  Screen,
  ScreenHeader,
  ScreenScroll,
  Card,
  SectionLabel,
  Pill,
  Dot,
  Button,
} from '../ui/components';
import { useSurface } from '../ui/surface';

/** Dot + "Ages 3-5" meta line, matching the prompt screen's age pill. */
const AgeMeta = ({ ageGroup }: { ageGroup: string }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={localStyles.meta}>
      <Dot color={findAgeGroup(ageGroup)?.bgColor ?? surface.accent} />
      <Text style={[localStyles.metaText, { color: colors.textSecondary }]}>Ages {ageGroup}</Text>
    </View>
  );
};

export const MadLibsScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const [templates, setTemplates] = useState<MadLibsTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fills, setFills] = useState<string[]>([]);

  useEffect(() => {
    MadLibsRepo.list().then(setTemplates);
  }, []);

  const selected = templates.find(t => t.id === selectedId);

  useEffect(() => {
    if (selected) setFills(new Array(selected.slots.length).fill(''));
  }, [selected]);

  if (!FeatureFlags.isPremium) {
    return (
      <Screen>
        <ScreenHeader title="Mad Libs Builder" onBack={() => navigation.goBack()} />
        <ScreenScroll>
          <Card style={localStyles.paywall}>
            <View style={[localStyles.lockBadge, { borderColor: surface.border }]}>
              <Feather name="lock" size={26} color={surface.accent} />
            </View>
            <Text style={[localStyles.paywallTitle, { color: colors.textPrimary }]}>
              Premium feature
            </Text>
            <Text style={[localStyles.paywallText, { color: colors.textSecondary }]}>
              The Mad Libs builder lets you craft custom prompts from age-appropriate templates.
              Available with Premium.
            </Text>
            {FeatureFlags.showSignup && (
              <Button
                label="See plans"
                onPress={() => navigation.navigate('Signup')}
              />
            )}
          </Card>
        </ScreenScroll>
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!selected) return;
    const preview = applyTemplate(selected.templateText, fills);
    const ageGroup = selected.ageGroup as AgeGroupId;
    await UserPromptRepo.save({ id: newUserPromptId(), ageGroup, text: preview, situations: [] });
    setSelectedId(null);
    setFills([]);
    Alert.alert('Saved to My Prompts', 'Want to try it now?', [
      { text: 'Done', style: 'cancel' },
      { text: 'Play in deck', onPress: () => playMyPromptsInDeck(navigation, ageGroup) },
    ]);
  };

  const setFill = (i: number, v: string) => {
    const next = [...fills];
    next[i] = v;
    setFills(next);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Mad Libs Builder"
        subtitle="Pick a template, fill the slots, save it as a custom prompt."
        onBack={() => navigation.goBack()}
      />
      <ScreenScroll>
        {!selected ? (
          templates.map(t => (
            <Card key={t.id} onPress={() => setSelectedId(t.id)}>
              <View style={localStyles.templateHeader}>
                <AgeMeta ageGroup={t.ageGroup} />
                <Feather name="chevron-right" size={18} color={colors.iconInactive} />
              </View>
              <Text style={[localStyles.templateText, { color: colors.textPrimary }]}>
                {applyTemplate(
                  t.templateText,
                  t.slots.map(s => `___ (${s.label})`)
                )}
              </Text>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <AgeMeta ageGroup={selected.ageGroup} />
              <Text style={[localStyles.previewText, { color: colors.textPrimary }]}>
                {applyTemplate(selected.templateText, fills.map(f => f || '___'))}
              </Text>
            </Card>
            {selected.slots.map((slot, i) => {
              const value = fills[i] ?? '';
              return (
                <View key={i} style={localStyles.slotGroup}>
                  <SectionLabel>{slot.label}</SectionLabel>
                  <TextInput
                    style={[
                      localStyles.slotInput,
                      {
                        color: colors.textPrimary,
                        backgroundColor: surface.card,
                        borderColor: value ? surface.accent : surface.border,
                      },
                    ]}
                    placeholder="Type your own…"
                    placeholderTextColor={colors.iconInactive}
                    value={value}
                    onChangeText={v => setFill(i, v)}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.suggestions}
                  >
                    {slot.suggestions.map(s => (
                      <Pill
                        key={s}
                        label={s}
                        active={value === s}
                        onPress={() => setFill(i, s)}
                      />
                    ))}
                  </ScrollView>
                </View>
              );
            })}
            <View style={localStyles.actionRow}>
              <View style={localStyles.actionItem}>
                <Button label="Pick another" variant="secondary" onPress={() => setSelectedId(null)} />
              </View>
              <View style={localStyles.actionItem}>
                <Button label="Save prompt" onPress={handleSave} />
              </View>
            </View>
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
};

const localStyles = StyleSheet.create({
  paywall: {
    marginTop: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  paywallText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 22,
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
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  templateText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 23,
  },
  previewText: {
    marginTop: Spacing.md,
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    lineHeight: Math.round(Typography.title2 * 1.3),
  },
  slotGroup: {
    gap: Spacing.sm,
  },
  slotInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  suggestions: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionItem: {
    flex: 1,
  },
});
