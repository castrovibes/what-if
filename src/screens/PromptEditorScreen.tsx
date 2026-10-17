import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { ageGroups, AgeGroupId } from '../data/ageGroups';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel, Pill, Dot, Button } from '../ui/components';
import { useSurface } from '../ui/surface';
import { useLiminalSpaces } from '../hooks/useLiminalSpaces';
import { useActiveContext } from '../providers/ActiveContextProvider';
import {
  UserPromptRepo,
  USER_PROMPT_MAX_LENGTH,
  newUserPromptId,
} from '../db/repositories/userPrompts';
import { CreateStackParamList } from '../navigation/types';
import { playMyPromptsInDeck } from '../navigation/deckLinks';

const STARTER = 'What if ';

/**
 * Write a prompt of your own, or edit one (route param `promptId`). The standard
 * follow-up question is added on the card, so this is only the "What if…?" part.
 */
export const PromptEditorScreen = () => {
  const navigation = useNavigation<NavigationProp<CreateStackParamList>>();
  const route = useRoute<RouteProp<CreateStackParamList, 'PromptEditor'>>();
  const editingId = route.params?.promptId;
  const { colors } = useTheme();
  const surface = useSurface();
  const spaces = useLiminalSpaces();
  const { activeContext } = useActiveContext();

  const [text, setText] = useState(STARTER);
  const [ageGroup, setAgeGroup] = useState<AgeGroupId | null>(
    (route.params?.ageGroup as AgeGroupId | undefined) ??
      (activeContext.ageGroupDefault as AgeGroupId | null) ??
      null,
  );
  const [situations, setSituations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    UserPromptRepo.get(editingId).then(p => {
      if (!p) return;
      setText(p.text);
      setAgeGroup(p.ageGroup);
      setSituations(p.situations);
    });
  }, [editingId]);

  const trimmed = text.trim();
  const hasContent = trimmed.length > 0 && trimmed.toLowerCase() !== STARTER.trim().toLowerCase();
  const canSave = hasContent && !!ageGroup && !saving;

  const toggleSituation = (id: string) =>
    setSituations(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const handleSave = async () => {
    if (!canSave || !ageGroup) return;
    setSaving(true);
    const finalText = /[?.!]$/.test(trimmed) ? trimmed : `${trimmed}?`;
    const id = editingId ?? newUserPromptId();
    await UserPromptRepo.save({
      id,
      text: finalText,
      ageGroup,
      situations,
    });
    setSaving(false);
    if (editingId) {
      navigation.goBack();
      return;
    }
    Alert.alert('Saved to My Prompts', 'Want to try it now?', [
      { text: 'Done', style: 'cancel', onPress: () => navigation.goBack() },
      {
        text: 'Play in deck',
        // The deck gets ready with this prompt on top while the editor stays put; the
        // editor closes after the switch, out of sight.
        onPress: async () => {
          await playMyPromptsInDeck(
            navigation as unknown as NavigationProp<ParamListBase>,
            ageGroup,
            id,
          );
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title={editingId ? 'Edit prompt' : 'Write a prompt'}
        subtitle={'Your own "What if…?". The card adds the usual follow-up question.'}
        onBack={() => navigation.goBack()}
      />
      <ScreenScroll>
        <SectionLabel>Your prompt</SectionLabel>
        <View>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: surface.card,
                borderColor: hasContent ? surface.accent : surface.border,
              },
            ]}
            value={text}
            onChangeText={setText}
            maxLength={USER_PROMPT_MAX_LENGTH}
            multiline
            autoFocus={!editingId}
            placeholder="What if…"
            placeholderTextColor={colors.iconInactive}
            accessibilityLabel="Your prompt"
          />
          <Text style={[styles.counter, { color: colors.iconInactive }]}>
            {text.length}/{USER_PROMPT_MAX_LENGTH}
          </Text>
        </View>

        <SectionLabel>Who it's for</SectionLabel>
        <View style={styles.pills}>
          {ageGroups.map(g => (
            <Pill
              key={g.id}
              label={g.label.replace('-', ' – ')}
              leading={<Dot color={g.bgColor} />}
              active={ageGroup === g.id}
              onPress={() => setAgeGroup(g.id)}
            />
          ))}
        </View>

        <SectionLabel>Good for (optional)</SectionLabel>
        <View style={styles.pills}>
          {spaces.map(s => {
            const on = situations.includes(s.id);
            return (
              <Pill
                key={s.id}
                label={s.name}
                leading={
                  <Feather
                    name={(s.icon as keyof typeof Feather.glyphMap) ?? 'circle'}
                    size={14}
                    color={on ? '#fff' : colors.iconDefault}
                  />
                }
                active={on}
                onPress={() => toggleSituation(s.id)}
              />
            );
          })}
        </View>

        <View style={styles.saveRow}>
          <Button
            label={editingId ? 'Save changes' : 'Save prompt'}
            onPress={handleSave}
            disabled={!canSave}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  saveRow: {
    marginTop: Spacing.md,
  },
});
