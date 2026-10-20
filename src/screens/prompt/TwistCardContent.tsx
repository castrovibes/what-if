import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { usePersonalization } from '../../hooks/usePersonalization';
import { applyTokens } from '../../data/personalizationTokens';
import { WorldBuildingCard } from '../../db/types';
import { cardStyles } from './cardStyles';
import { TWIST_SLIDE } from './deck';
import { FittedPromptText } from './FittedPromptText';

const difficultyLabel = (difficulty: number) =>
  difficulty <= 1 ? 'Gentle' : difficulty === 2 ? 'Deeper' : 'Challenging';

/**
 * The back of the top card: one twist at a time, in place of the prompt. The pips
 * show which twist this is; the arrows (or swiping the card) move between them.
 * `shift` slides the twist text out and the next one in.
 */
export const TwistCardContent = ({
  card,
  index,
  count,
  fullQuestion,
  accent,
  shift,
  onPrev,
  onNext,
}: {
  card: WorldBuildingCard;
  index: number;
  count: number;
  fullQuestion: string;
  accent: string;
  shift: SharedValue<number>;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const personalization = usePersonalization();
  const textStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.abs(shift.value) / TWIST_SLIDE),
    transform: [{ translateX: shift.value }],
  }));
  // The difficulty pill changes width between twists, so it fades out and back in
  // with the text (without sliding) and resizes while it's invisible.
  const pillStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.abs(shift.value) / TWIST_SLIDE),
  }));
  const hasPrev = index > 0;
  const hasNext = index < count - 1;

  return (
    <>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.sourceRow}>
          <Feather name="shuffle" size={14} color={accent} />
          <Text style={[cardStyles.sourceText, { color: accent }]}>Twist</Text>
        </View>
        <Animated.View
          style={[
            cardStyles.categoryPill,
            cardStyles.difficultyPill,
            { borderColor: surface.border },
            pillStyle,
          ]}
        >
          {[1, 2, 3].map(level => (
            <View
              key={level}
              style={[
                cardStyles.difficultyDot,
                { backgroundColor: level <= card.difficulty ? accent : surface.border },
              ]}
            />
          ))}
          <Text style={[cardStyles.categoryText, { color: colors.textSecondary }]}>
            {difficultyLabel(card.difficulty).toUpperCase()}
          </Text>
        </Animated.View>
      </View>

      <View style={cardStyles.cardBody}>
        <Animated.View style={[cardStyles.twistTextSlot, textStyle]}>
          <FittedPromptText
            text={applyTokens(card.cardText, personalization)}
            color={colors.textPrimary}
          />
        </Animated.View>
        <Text style={[cardStyles.fullQuestion, { color: colors.textSecondary }]}>
          {fullQuestion}
        </Text>
      </View>

      <View style={cardStyles.twistFooter}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={!hasPrev}
          hitSlop={10}
          style={!hasPrev && cardStyles.disabled}
          accessibilityLabel="Previous twist"
        >
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View
          style={cardStyles.twistPips}
          accessible
          accessibilityLabel={`Twist ${index + 1} of ${count}`}
        >
          {Array.from({ length: count }, (_, i) => (
            <View
              key={i}
              style={[
                cardStyles.twistPip,
                i === index
                  ? { width: 18, backgroundColor: PINK }
                  : { backgroundColor: colors.iconInactive },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={onNext}
          disabled={!hasNext}
          hitSlop={10}
          style={!hasNext && cardStyles.disabled}
          accessibilityLabel="Next twist"
        >
          <Feather name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </>
  );
};
