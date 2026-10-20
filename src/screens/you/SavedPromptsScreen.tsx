import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { findAgeGroup } from '../../data/ageGroups';
import { Screen, ScreenHeader, ScreenList, Card, Dot, Button } from '../../ui/components';
import { useSurface, PINK } from '../../ui/surface';
import { haptic } from '../../ui/haptics';
import { useFavorites } from '../../hooks/useFavorites';
import { useCategories } from '../../hooks/useCategories';
import { usePersonalization } from '../../hooks/usePersonalization';
import { applyTokens } from '../../data/personalizationTokens';
import { useActiveContext } from '../../providers/ActiveContextProvider';
import { PromptRepo } from '../../db/repositories/prompts';
import { Prompt } from '../../db/types';
import { playInDeck } from '../../navigation/deckLinks';

const ageLabel = (label: string) => label.replace(' years', '').replace('-', '–');

/**
 * The prompts saved with ♥ for the active group, newest first: tap or ▶ to open the
 * deck on one, ♥ to unsave. Originals and your own prompts both appear here.
 */
export const SavedPromptsScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { activeContext } = useActiveContext();
  const { favorites, toggle } = useFavorites();
  const categories = useCategories();
  const personalization = usePersonalization();
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  // The favorites set keeps the repository's order (newest first). A prompt that was
  // deleted (one of yours, hidden) is left out, since it can't be played.
  const ids = [...favorites].join('\n');
  useEffect(() => {
    let cancelled = false;
    PromptRepo.findByIds(ids ? ids.split('\n') : []).then(list => {
      if (!cancelled) setPrompts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const play = (p: Prompt) =>
    playInDeck(navigation, {
      source: p.source === 'user' ? 'user' : 'official',
      ageGroup: p.ageGroup,
      promptId: p.id,
    });

  const unsave = (p: Prompt) => {
    haptic.selection();
    toggle(p.id);
  };

  const openDeck = () => (navigation.getParent() ?? navigation).navigate('Prompts');

  const renderPrompt = ({ item: p }: { item: Prompt }) => {
    const age = findAgeGroup(p.ageGroup);
    const category = categories.find(c => c.id === p.categoryId)?.name;
    const meta = [age ? `Ages ${ageLabel(age.label)}` : null, p.source === 'user' ? 'My Prompts' : category]
      .filter(Boolean)
      .join(' · ');
    return (
      <Card onPress={() => play(p)}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>
          {applyTokens(p.text, personalization)}
        </Text>
        <View style={styles.footer}>
          <Dot color={age?.bgColor} />
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {meta}
          </Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={() => play(p)} hitSlop={8} accessibilityLabel="Open in the deck">
            <Feather name="play" size={18} color={surface.accent} />
          </TouchableOpacity>
          {/* Filled, like the deck's ♥ when a prompt is saved. */}
          <TouchableOpacity
            onPress={() => unsave(p)}
            hitSlop={10}
            style={styles.heart}
            accessibilityLabel="Remove from saved"
          >
            <Feather name="heart" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Saved Prompts"
        subtitle={`Prompts you've saved with ♥ for ${activeContext.label}.`}
        onBack={() => navigation.goBack()}
      />
      {/* A FlatList: favorites can grow without bound. Nothing shows until the first
          load, so the empty card doesn't flash before the list arrives. */}
      <ScreenList
        data={prompts}
        keyExtractor={p => p.id}
        renderItem={renderPrompt}
        ListEmptyComponent={
          prompts === null ? null : (
            <Card style={styles.empty}>
              <Feather name="heart" size={28} color={PINK} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nothing saved yet. Tap ♥ on a prompt card to keep it here.
              </Text>
              <Button label="Open the deck" icon="play" onPress={openDeck} />
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
    fontFamily: 'Geomini-SemiBold',
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
  heart: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 22,
  },
});
