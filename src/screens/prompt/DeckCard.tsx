import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { cardStyles } from './cardStyles';
import { DEEPEST_SLOT, FLIP_LIFT, SLOTS, SLOT_ROTATE, SLOT_Y, ShadowBase, deckShadow } from './deck';

/**
 * One prompt card in the deck. Each card keeps the same prompt for as long as it's
 * mounted; only `progress` (the deck position, in prompt indexes) moves it. Where the
 * card sits relative to the position decides how it looks:
 *   - behind the top (d > 0): in a deck slot, its shadow sized to match; one slot
 *     past the deepest it's fully transparent, and fades in as it arrives;
 *   - on top (d = 0): the current prompt;
 *   - passed (-1 < d < 0): flying off to the left (or back in, when going back).
 */
export const DeckCard = ({
  index,
  progress,
  width,
  shadow,
  interactive,
  flip,
  style,
  children,
}: {
  index: number;
  progress: SharedValue<number>;
  width: number;
  shadow: ShadowBase;
  interactive: boolean;
  /** 0 = front, 1 = flipped over (the top card only). */
  flip?: SharedValue<number>;
  style: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) => {
  // Where the card sits in the deck (see above), before any flip, for deck position p.
  const deckCardStyle = (p: number) => {
    'worklet';
    // Tugging the first prompt to the right, with nothing before it: rubber-band.
    if (index === 0 && p < 0) {
      return {
        opacity: 1,
        ...deckShadow(0, shadow),
        transform: [{ translateX: -p * width * 1.2 }, { rotate: `${-p * 14}deg` }],
      };
    }
    const d = index - p;
    if (d < 0) {
      return {
        opacity: d > -1 ? 1 : 0,
        ...deckShadow(0, shadow),
        transform: [{ translateX: d * width * 1.2 }, { rotate: `${d * 14}deg` }],
      };
    }
    const slot = Math.min(d, DEEPEST_SLOT);
    return {
      opacity: interpolate(d, [DEEPEST_SLOT, DEEPEST_SLOT + 1], [1, 0], 'clamp'),
      ...deckShadow(slot, shadow),
      transform: [
        { translateY: interpolate(slot, SLOTS, SLOT_Y) },
        { rotate: `${interpolate(slot, SLOTS, SLOT_ROTATE)}deg` },
      ],
    };
  };
  const animated = useAnimatedStyle(() => {
    // Read the shared values here, at the top level: Reanimated only re-runs this
    // style for values read directly in it, not inside a helper it calls.
    const p = progress.value;
    const flipped = flip ? flip.value : 0;
    const placed = deckCardStyle(p);
    // Turning over: the card narrows to its edge and widens again (the faces swap at
    // the edge), swelling slightly as if picked up and set back down. This is a 2D
    // squeeze rather than a 3D rotation, which on iOS let half the card sink behind
    // its own back face and the deck.
    return {
      ...placed,
      transform: [
        ...placed.transform,
        { scale: 1 + FLIP_LIFT * Math.sin(Math.PI * flipped) },
        { scaleX: Math.max(0.001, Math.abs(Math.cos(Math.PI * flipped))) },
      ],
    };
  });
  return (
    <Animated.View
      style={[style, animated]}
      pointerEvents={interactive ? 'auto' : 'none'}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
    >
      <View style={cardStyles.stackCardClip}>{children}</View>
    </Animated.View>
  );
};
