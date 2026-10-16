import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface, PINK, CARD_RADIUS } from '../ui/surface';
import { Screen, ScreenHeader, Button } from '../ui/components';
import { Typography, Spacing } from '../utils/deviceHelpers';

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Pick an Age Group',
    description:
      "Tap the age pill at the top of the Prompts screen and choose the range that best matches the child you're talking with. Prompts are designed to be developmentally appropriate.",
  },
  {
    title: 'Read the Prompt Together',
    description:
      'Share the "What if..." scenario with the child. Use the audio button if helpful. Take your time—there\'s no rush.',
  },
  {
    title: 'Listen and Explore Together',
    description:
      'Ask open-ended questions. There are no right or wrong answers. Focus on their thinking process, not finding the "correct" solution.',
  },
  {
    title: 'Discuss Multiple Possibilities',
    description:
      'Encourage thinking about different options. What might happen with each choice? How might others feel? What values matter here?',
  },
];

const LAST = STEPS.length - 1;
const DECK_HEIGHT = 360;
const SWIPE_MS = 320;
// Fraction of the screen width a drag must cover to change slides (or a quick flick).
const SWIPE_THRESHOLD = 0.22;
const FLICK_VELOCITY = 0.5;

// Resting offsets of each slot in the deck, top card first. The first two match the
// prompt screen's stack; each card left to read adds another peeking edge, so the
// stack visibly shrinks as you go.
const SLOT_Y = [0, 6, 12, 18];
const SLOT_ROTATE = [0, -1.5, 2, -2.5];
const SLOTS = SLOT_Y.map((_, i) => i);

/**
 * One tip, styled like a prompt card. `progress` is the deck position (0 = first tip
 * on top, fractional while dragging). Cards already read fly off to the left; the
 * rest sit in the stack and slide up a slot as the card above leaves.
 */
const TipCard = ({
  index,
  progress,
  width,
}: {
  index: number;
  progress: SharedValue<number>;
  width: number;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const step = STEPS[index];

  const style = useAnimatedStyle(() => {
    const d = index - progress.value;
    if (d < 0) {
      // Leaving (or returning) on the left, like a skipped prompt.
      return {
        opacity: d <= -1 ? 0 : 1,
        transform: [{ translateX: d * width * 1.2 }, { rotate: `${d * 14}deg` }],
      };
    }
    // A card beyond the deepest slot hides exactly behind it.
    const slot = Math.min(d, SLOTS.length - 1);
    return {
      opacity: 1,
      transform: [
        { translateY: interpolate(slot, SLOTS, SLOT_Y) },
        { rotate: `${interpolate(slot, SLOTS, SLOT_ROTATE)}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        local.card,
        { backgroundColor: surface.card, borderColor: surface.border, zIndex: STEPS.length - index },
        surface.shadow,
        style,
      ]}
    >
      <View style={local.cardBody}>
        <Text style={[local.title, { color: colors.textPrimary }]}>{step.title}</Text>
        <Text style={[local.description, { color: colors.textSecondary }]}>{step.description}</Text>
      </View>
    </Animated.View>
  );
};

/** Carousel pip; the active one stretches into a pink pill, following the drag. */
const Pip = ({
  index,
  progress,
  onPress,
}: {
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const t = Math.max(0, 1 - Math.abs(index - progress.value));
    return {
      width: interpolate(t, [0, 1], [8, 24]),
      backgroundColor: interpolateColor(t, [0, 1], [colors.iconInactive, PINK]),
    };
  });
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={`Go to tip ${index + 1}`}>
      <Animated.View style={[local.pip, style]} />
    </Pressable>
  );
};

export const WelcomeTutorialScreen = ({ onComplete }: { onComplete: () => void }) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const progress = useSharedValue(0);

  const settle = (i: number) => {
    indexRef.current = i;
    setIndex(i);
  };

  // Swiping past the last tip (or tapping the button) ends the tutorial; the last
  // card flies off like the others before it closes.
  const finishingRef = useRef(false);
  const finish = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    onComplete();
  };
  const swipeOffLast = () => {
    if (finishingRef.current) return;
    progress.value = withTiming(
      LAST + 1,
      { duration: SWIPE_MS, easing: Easing.in(Easing.quad) },
      finished => {
        if (finished) runOnJS(finish)();
      },
    );
  };

  const goTo = (target: number) => {
    const i = Math.max(0, Math.min(LAST, target));
    indexRef.current = i;
    progress.value = withTiming(
      i,
      { duration: SWIPE_MS, easing: Easing.out(Easing.quad) },
      finished => {
        if (finished) runOnJS(settle)(i);
      },
    );
  };

  // Rebuilt each render so the handlers see the current width and goTo.
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      let p = indexRef.current - g.dx / width;
      // Rubber-band past the first and last tips.
      if (p < 0) p = p / 3;
      if (p > LAST) p = LAST + (p - LAST) / 3;
      progress.value = p;
    },
    onPanResponderRelease: (_, g) => {
      const forward = g.dx < -width * SWIPE_THRESHOLD || g.vx < -FLICK_VELOCITY;
      const back = g.dx > width * SWIPE_THRESHOLD || g.vx > FLICK_VELOCITY;
      if (forward && indexRef.current === LAST) swipeOffLast();
      else goTo(indexRef.current + (forward ? 1 : back ? -1 : 0));
    },
    onPanResponderTerminate: () => goTo(indexRef.current),
  });

  const current = STEPS[index];
  const onLast = index === LAST;

  // The button fades in as the last tip arrives. Its space is always reserved so the
  // deck doesn't shift when it appears.
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [LAST - 1, LAST], [0, 1], 'clamp'),
  }));

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Back arrow only; the empty title keeps it at the usual header position. */}
      <ScreenHeader title="" onBack={() => navigation.goBack()} />
      <View style={local.body}>
        <View
          style={local.deck}
          {...pan.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Tip ${index + 1} of ${STEPS.length}: ${current.title}. ${current.description}`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e =>
            goTo(indexRef.current + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
          }
        >
          {STEPS.map((step, i) => (
            <TipCard
              key={step.title}
              index={i}
              progress={progress}
              width={width}
            />
          ))}
        </View>

        <View style={local.pips}>
          {STEPS.map((step, i) => (
            <Pip key={step.title} index={i} progress={progress} onPress={() => goTo(i)} />
          ))}
        </View>
      </View>

      <Animated.View
        style={[local.cta, ctaStyle]}
        pointerEvents={onLast ? 'auto' : 'none'}
        accessibilityElementsHidden={!onLast}
        importantForAccessibility={onLast ? 'auto' : 'no-hide-descendants'}
      >
        <Button label="Let's Get Started" onPress={finish} />
      </Animated.View>
    </Screen>
  );
};

const local = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  deck: {
    height: DECK_HEIGHT,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.title1,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    lineHeight: Math.round(Typography.title1 * 1.25),
  },
  description: {
    marginTop: Spacing.md,
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    lineHeight: 23,
  },
  pips: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
  },
  pip: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});
