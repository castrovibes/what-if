import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { WorldBuildingCard } from '../db/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

const FRAME_BORDER_WIDTH = 1;
const SCROLL_HORIZONTAL_PADDING = Spacing.lg;
const initialItemWidth = Math.max(
  0,
  Dimensions.get('window').width - SCROLL_HORIZONTAL_PADDING * 2 - FRAME_BORDER_WIDTH * 2,
);

const DifficultyDots = ({ value, color }: { value: number; color: string }) => (
  <View style={localStyles.difficultyRow}>
    {[1, 2, 3].map(level => (
      <View
        key={level}
        style={[
          localStyles.difficultyDot,
          { backgroundColor: level <= value ? color : 'rgba(73, 41, 126, 0.18)' },
        ]}
      />
    ))}
  </View>
);

const Card = ({
  card,
  accent,
  width,
  paddingTop,
}: {
  card: WorldBuildingCard;
  accent: string;
  width: number;
  paddingTop: number;
}) => {
  const { colors } = useTheme();
  const difficultyLabel =
    card.difficulty <= 1 ? 'Gentle' : card.difficulty === 2 ? 'Deeper' : 'Challenging';
  return (
    <View style={[localStyles.cardContent, { width, paddingTop }]}>
      <View style={localStyles.cardHeader}>
        <DifficultyDots value={card.difficulty} color={accent} />
        <Text style={[localStyles.difficultyLabel, { color: colors.textSecondary }]}>
          {difficultyLabel.toUpperCase()}
        </Text>
      </View>
      <Text style={[localStyles.cardText, { color: colors.textPrimary }]}>{card.cardText}</Text>
    </View>
  );
};

export const WorldBuildingCarousel = ({
  cards,
  resetKey,
  accent = '#e10086',
  peekFromTop = 0,
  bgColor,
}: {
  cards: WorldBuildingCard[];
  resetKey?: string;
  accent?: string;
  // When > 0, the frame is shifted up by this many px so its top edge sits behind
  // whatever sibling renders above it (e.g. the prompt card). Visible content is
  // pushed down by the same amount so it lands in the right place.
  peekFromTop?: number;
  bgColor?: string;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemWidth, setItemWidth] = useState(initialItemWidth);
  const listRef = useRef<FlatList<WorldBuildingCard>>(null);
  const { colors } = useTheme();

  // Reset to first card when the parent signals via resetKey (e.g. prompt change)
  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [resetKey]);

  if (cards.length === 0) return null;

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (itemWidth === 0) return;
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
    setActiveIndex(Math.max(0, Math.min(newIndex, cards.length - 1)));
  };

  return (
    <View
      style={[
        localStyles.frame,
        {
          backgroundColor: bgColor ?? colors.cardBg,
          borderColor: colors.tipsBoxBorder,
          borderWidth: FRAME_BORDER_WIDTH,
          marginTop: -peekFromTop,
        },
      ]}
      onLayout={e => {
        const innerWidth = Math.max(0, e.nativeEvent.layout.width - FRAME_BORDER_WIDTH * 2);
        if (innerWidth !== itemWidth) {
          setItemWidth(innerWidth);
        }
      }}
    >
      <FlatList
        ref={listRef}
        data={cards}
        keyExtractor={c => c.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        // Every page is itemWidth wide, so the list can place and scroll to any index
        // without measuring (and scrollToOffset never lands between pages).
        getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
        renderItem={({ item }) => (
          <Card
            card={item}
            accent={accent}
            width={itemWidth}
            paddingTop={Spacing.sm + peekFromTop}
          />
        )}
        decelerationRate="fast"
      />

      {cards.length > 1 && (
        <View style={localStyles.dotsRow}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                localStyles.dot,
                { backgroundColor: i === activeIndex ? accent : colors.bgMuted },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  // The "static window" — fixed border, clips swipe content. Top corners are
  // intentionally square because the top edge sits behind the prompt card and
  // rounded tops would peek through where the prompt card's own rounded bottom
  // corners curve inward.
  frame: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    // paddingTop is supplied via prop so the peek effect can vary it
    minHeight: 64,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 3,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyLabel: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  cardText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    lineHeight: 20,
  },
  // Dots live INSIDE the frame at the bottom — part of the "window"
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
    paddingBottom: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
