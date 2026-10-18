import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface } from '../../ui/surface';
import { usePersonalization } from '../../hooks/usePersonalization';
import { applyTokens } from '../../data/personalizationTokens';
import { Category, Prompt } from '../../db/types';
import { cardStyles } from './cardStyles';
import { SOURCE_LABEL } from './deck';
import { FittedPromptText } from './FittedPromptText';

/**
 * The inside of a prompt card. Used for the live top card and, without handlers,
 * for the next prompt peeking out underneath it.
 */
export const PromptCardContent = ({
  prompt,
  category,
  accent,
  tipCount,
  onReport,
  onDiscussion,
  showListen = true,
  speaking = false,
  onListen,
  onSourcePress,
}: {
  prompt: Prompt;
  category: Category | undefined;
  accent: string;
  tipCount?: number;
  onReport?: () => void;
  onDiscussion?: () => void;
  /** Hidden when Text-to-Speech is turned off in Settings. */
  showListen?: boolean;
  speaking?: boolean;
  onListen?: () => void;
  /** Opens the deck source picker; the label shows a ⌄ on every card in the deck. */
  onSourcePress?: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const personalization = usePersonalization();
  const noTips = tipCount === 0;
  const text = applyTokens(prompt.text, personalization);

  return (
    <>
      <View style={cardStyles.cardHeader}>
        <TouchableOpacity
          style={cardStyles.sourceRow}
          onPress={onSourcePress}
          disabled={!onSourcePress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${SOURCE_LABEL[prompt.source]}. Choose which prompts to show`}
        >
          <Ionicons
            name={prompt.source === 'user' ? 'folder-outline' : 'sparkles-outline'}
            size={14}
            color={accent}
          />
          <Text style={[cardStyles.sourceText, { color: accent }]}>
            {SOURCE_LABEL[prompt.source]}
          </Text>
          <Feather name="chevron-down" size={14} color={accent} />
        </TouchableOpacity>
        <View style={cardStyles.cardHeaderRight}>
          {category && (
            <View style={[cardStyles.categoryPill, { borderColor: surface.border }]}>
              <Text style={[cardStyles.categoryText, { color: colors.textSecondary }]}>
                {category.name.toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={onReport} hitSlop={8} accessibilityLabel="Report this prompt">
            <Feather name="flag" size={16} color={colors.iconDefault} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={cardStyles.cardBody}>
        {/* The prompt is centered in the space left above the follow-up question. */}
        <FittedPromptText text={text} color={colors.textPrimary} />
        {/* Pinned a fixed distance above the Listen / Tips row on every card. */}
        <Text style={[cardStyles.fullQuestion, { color: colors.textSecondary }]}>
          {prompt.fullQuestion}
        </Text>
      </View>

      <View style={cardStyles.cardFooter}>
        {showListen ? (
          <TouchableOpacity
            style={cardStyles.footerButton}
            onPress={onListen}
            accessibilityLabel={speaking ? 'Stop reading aloud' : 'Read this prompt aloud'}
          >
            <Feather name={speaking ? 'square' : 'volume-2'} size={16} color={colors.textPrimary} />
            <Text style={[cardStyles.footerText, { color: colors.textPrimary }]}>
              {speaking ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {/* Hidden, not dimmed, when a prompt has no tips: a dimmed control looks broken. */}
        {noTips ? (
          <View />
        ) : (
          <TouchableOpacity
            style={cardStyles.footerButton}
            onPress={onDiscussion}
            accessibilityLabel="Discussion tips"
          >
            <Feather name="info" size={16} color={colors.textPrimary} />
            <Text style={[cardStyles.footerText, { color: colors.textPrimary }]}>Tips</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};
