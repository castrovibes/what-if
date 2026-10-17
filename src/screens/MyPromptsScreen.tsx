import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { findAgeGroup } from '../data/ageGroups';
import { Screen, ScreenHeader, ScreenList, Card, Dot, Button } from '../ui/components';
import { useSurface } from '../ui/surface';
import { useLiminalSpaces } from '../hooks/useLiminalSpaces';
import { UserPromptRepo, UserPrompt } from '../db/repositories/userPrompts';
import { CreateStackParamList } from '../navigation/types';
import { playMyPromptsInDeck } from '../navigation/deckLinks';

/** Prompts you've made (Write a prompt and Mad Libs): edit, delete, or play them. */
export const MyPromptsScreen = () => {
  const navigation = useNavigation<NavigationProp<CreateStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const spaces = useLiminalSpaces();
  const [prompts, setPrompts] = useState<UserPrompt[] | null>(null);

  // Reload whenever the list comes back into view (e.g. after editing a prompt).
  useFocusEffect(
    useCallback(() => {
      UserPromptRepo.list().then(setPrompts);
    }, []),
  );

  const confirmDelete = (p: UserPrompt) =>
    Alert.alert('Delete this prompt?', p.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await UserPromptRepo.remove(p.id);
          setPrompts(list => list?.filter(x => x.id !== p.id) ?? null);
        },
      },
    ]);

  const renderPrompt = ({ item: p }: { item: UserPrompt }) => {
    const age = findAgeGroup(p.ageGroup);
    const names = p.situations
      .map(id => spaces.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return (
      <Card onPress={() => navigation.navigate('PromptEditor', { promptId: p.id })}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>{p.text}</Text>
        <View style={styles.footer}>
          <Dot color={age?.bgColor} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Ages {age?.label.replace(' years', '') ?? p.ageGroup}
            {names ? ` · ${names}` : ''}
          </Text>
          <View style={styles.spacer} />
          <TouchableOpacity
            onPress={() =>
              playMyPromptsInDeck(
                navigation as unknown as NavigationProp<ParamListBase>,
                p.ageGroup,
                p.id,
              )
            }
            hitSlop={8}
            accessibilityLabel="Play my prompts in the deck"
          >
            <Feather name="play" size={18} color={surface.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDelete(p)}
            hitSlop={8}
            accessibilityLabel="Delete prompt"
          >
            <Feather name="trash-2" size={18} color={colors.iconDefault} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="My Prompts"
        subtitle="Prompts you've written or built with Mad Libs."
        onBack={() => navigation.goBack()}
      />
      {/* A FlatList: the user's prompts can grow without bound. Nothing shows until
          the first load, so the empty card doesn't flash before the list arrives. */}
      <ScreenList
        data={prompts}
        keyExtractor={p => p.id}
        renderItem={renderPrompt}
        ListEmptyComponent={
          prompts === null ? null : (
            <Card style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You haven’t made any prompts yet.
              </Text>
              <Button
                label="Write a prompt"
                icon="edit-3"
                onPress={() => navigation.navigate('PromptEditor')}
              />
            </Card>
          )
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: Typography.body,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: 23,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  meta: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
});
