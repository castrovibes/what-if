import React, { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Spacing } from '../utils/deviceHelpers';

/**
 * A horizontally scrolling row of cards for a screen section (Explore's Series,
 * Community and Articles). Each card is a little narrower than the screen so the next
 * one peeks in from the right, and scrolling snaps card by card. Cards in a row share
 * the tallest card's height; give each one `fill` (Card) so they line up.
 *
 * Use it inside ScreenScroll: it bleeds out through the screen's side padding so cards
 * scroll edge to edge, while the first card still lines up with the content above.
 */
export function Carousel<T>({
  items,
  renderItem,
  keyFor,
  widthRatio = 0.8,
}: {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyFor: (item: T, index: number) => string;
  /** Card width as a share of the screen width. */
  widthRatio?: number;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * widthRatio);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
    >
      {items.map((item, i) => (
        <View key={keyFor(item, i)} style={{ width: cardWidth }}>
          {renderItem(item, i)}
        </View>
      ))}
    </ScrollView>
  );
}

const GAP = Spacing.md;

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -Spacing.lg,
    flexGrow: 0,
  },
  row: {
    gap: GAP,
    paddingHorizontal: Spacing.lg,
    // Room for the cards' shadows, which the scroll view would otherwise clip.
    paddingVertical: Spacing.sm,
  },
});
