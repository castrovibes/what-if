import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../providers/ThemeProvider';
import { useSurface, PINK, CARD_RADIUS } from '../ui/surface';
import { Screen, ScreenHeader, Button } from '../ui/components';
import { useTabBarInset } from '../navigation/tabBarInset';
import { useReduceMotion } from '../navigation/transitions';
import { Typography, Spacing } from '../utils/deviceHelpers';

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Pick an Age Group',
    description:
      "Choose who you're talking with and the deck opens on your first prompt. Prompts are written to be developmentally appropriate, and you can change the age range any time from the pill above the card.",
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

// The tutorial opens on an introduction (page 0), then one page per tip. Pages are
// what the swipes, the pips and `progress` count; tip i is page i + 1.
const INTRO =
  "We wrote thousands of questions that help foster meaningful conversations with children that spark critical thinking and ethical reasoning. We're glad you're here.\n\nLet's get started.";
const PAGES = STEPS.length + 1;
const LAST = PAGES - 1;
const DECK_HEIGHT = 360;
const SWIPE_MS = 320;
// Fraction of the screen width a drag must cover to change slides (or a quick flick).
const SWIPE_THRESHOLD = 0.22;
const FLICK_VELOCITY = 500; // px/s (Gesture Handler reports velocity per second)

// Resting offsets of each slot in the deck, top card first. The first two match the
// prompt screen's stack; each card left to read adds another peeking edge, so the
// stack visibly shrinks as you go.
const SLOT_Y = [0, 6, 12, 18];
const SLOT_ROTATE = [0, -1.5, 2, -2.5];
const SLOTS = SLOT_Y.map((_, i) => i);

/**
 * One tip, styled like a prompt card. `progress` is the page position (0 = the
 * introduction, 1 = first tip on top, fractional while dragging). Cards already read
 * fly off to the left; the rest sit in the stack and slide up a slot as the card above
 * leaves. Between the introduction and the first tip the deck just fades in.
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
    const d = index - Math.max(0, progress.value - 1);
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
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={index === 0 ? 'Go to the introduction' : `Go to tip ${index}`}
    >
      <Animated.View style={[local.pip, style]} />
    </Pressable>
  );
};

export const WelcomeTutorialScreen = ({ onComplete }: { onComplete: () => void }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const surface = useSurface();
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

  // The drag runs on the UI thread; the decision at release comes back to JS through
  // a ref, so it always sees the current goTo / swipeOffLast without rebuilding.
  const onRelease = useRef((_forward: boolean, _back: boolean) => {});
  onRelease.current = (forward, back) => {
    if (forward && indexRef.current === LAST) swipeOffLast();
    else goTo(indexRef.current + (forward ? 1 : back ? -1 : 0));
  };
  const release = useCallback((forward: boolean, back: boolean) => onRelease.current(forward, back), []);
  const dragStart = useSharedValue(0);
  const dragging = useSharedValue(false);
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(() => {
      dragging.value = true;
      dragStart.value = progress.value;
    })
    .onUpdate(e => {
      let p = dragStart.value - e.translationX / width;
      // Rubber-band past the first and last tips.
      if (p < 0) p = p / 3;
      if (p > LAST) p = LAST + (p - LAST) / 3;
      progress.value = p;
    })
    .onEnd(e => {
      dragging.value = false;
      const forward = e.translationX < -width * SWIPE_THRESHOLD || e.velocityX < -FLICK_VELOCITY;
      const back = e.translationX > width * SWIPE_THRESHOLD || e.velocityX > FLICK_VELOCITY;
      runOnJS(release)(forward, back);
    })
    .onFinalize((_, success) => {
      if (!success && dragging.value) {
        dragging.value = false;
        runOnJS(release)(false, false);
      }
    });

  const current = index > 0 ? STEPS[index - 1] : null;
  const onLast = index === LAST;

  // The first swipe moves the introduction off to the left while the card deck comes
  // in from the right, following the finger like a page.
  const introStyle = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, progress.value));
    return { transform: [{ translateX: -t * width }] };
  });
  const deckStyle = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, progress.value));
    return { transform: [{ translateX: (1 - t) * width }] };
  });

  // The button fades in as the last tip arrives. Its space is always reserved so the
  // deck doesn't shift when it appears.
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [LAST - 1, LAST], [0, 1], 'clamp'),
  }));
  // Replayed from the You tab, the button must clear the floating tab bar.
  const tabInset = useTabBarInset();

  // On the introduction the page pips are hidden; a right-pointing arrow under the text
  // invites the first swipe instead (and can be tapped). The arrow is part of the intro,
  // so it slides off with the text; the pips fade in as the first page moves.
  const onIntro = index === 0;
  const pipsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, progress.value)),
  }));
  const nudge = useSharedValue(0);
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    nudge.value = reduceMotion
      ? 0
      : withRepeat(
          withSequence(
            withTiming(6, { duration: 650, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
        );
  }, [nudge, reduceMotion]);
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value }],
  }));

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Getting started" onBack={() => navigation.goBack()} />
      <View style={local.body}>
        <GestureDetector gesture={pan}>
          <View
            style={local.deck}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={
              current
                ? `Tip ${index} of ${STEPS.length}: ${current.title}. ${current.description}`
                : `Welcome. ${INTRO}`
            }
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={e =>
              goTo(indexRef.current + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
            }
          >
            <Animated.View style={[StyleSheet.absoluteFill, deckStyle]} pointerEvents="none">
              {STEPS.map((step, i) => (
                <TipCard key={step.title} index={i} progress={progress} width={width} />
              ))}
            </Animated.View>
            <Animated.View
              style={[local.intro, introStyle]}
              pointerEvents={onIntro ? 'box-none' : 'none'}
            >
              <Text style={[local.introTitle, { color: surface.accent }]} accessibilityRole="header">
                Welcome
              </Text>
              <Text style={[local.introText, { color: colors.textSecondary }]}>{INTRO}</Text>
              <Animated.View style={[local.arrowWrap, arrowStyle]}>
                <Pressable
                  onPress={() => goTo(1)}
                  style={local.arrow}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Next: the first tip"
                >
                  <Feather name="arrow-right" size={22} color="#fff" />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>
        </GestureDetector>

        <Animated.View
          style={[local.pips, pipsStyle]}
          pointerEvents={onIntro ? 'none' : 'auto'}
          accessibilityElementsHidden={onIntro}
          importantForAccessibility={onIntro ? 'no-hide-descendants' : 'auto'}
        >
          {Array.from({ length: PAGES }, (_, i) => (
            <Pip key={i} index={i} progress={progress} onPress={() => goTo(i)} />
          ))}
        </Animated.View>
      </View>

      <Animated.View
        style={[local.cta, { paddingBottom: Spacing.md + tabInset }, ctaStyle]}
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
    fontFamily: 'Geomini-Bold',
    lineHeight: Math.round(Typography.title1 * 1.25),
  },
  description: {
    marginTop: Spacing.md,
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    lineHeight: 23,
  },
  intro: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  introTitle: {
    fontSize: Typography.title1,
    fontFamily: 'Geomini-ExtraBold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  introText: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    lineHeight: Math.round(Typography.callout * 1.5),
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 280,
  },
  pips: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    height: 44,
  },
  // Under the introduction text; moves with it.
  arrowWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
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
