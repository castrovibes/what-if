import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  Modal,
  TextInput,
  Alert,
  Pressable,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  cancelAnimation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { ageGroups, findAgeGroup, AgeGroupId } from '../data/ageGroups';
import { usePromptsForAge } from '../hooks/usePromptsForAge';
import { useFavorites } from '../hooks/useFavorites';
import { useWorldBuilding } from '../hooks/useWorldBuilding';
import { usePersonalization } from '../hooks/usePersonalization';
import { useLiminalSpaces } from '../hooks/useLiminalSpaces';
import { useCategories } from '../hooks/useCategories';
import { useTipsForPrompt } from '../hooks/useTipsForPrompt';
import { useTtsEnabled } from '../hooks/useTtsEnabled';
import { DiscussionTips } from '../components/DiscussionTips';
import { ReflectionRepo } from '../db/repositories/reflections';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { ReportReason, submitPromptReport } from '../backend/reports';
import { Category, Prompt, PromptSource, WorldBuildingCard } from '../db/types';
import { applyTokens } from '../data/personalizationTokens';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK, CARD_RADIUS } from '../ui/surface';
import { useReduceMotion } from '../navigation/transitions';
import { Screen, ScreenHeader, Pill, Dot, Button, BottomSheet, SheetOption } from '../ui/components';

const CARD_MARGIN_BOTTOM = 24;
const CARD_CORNER_RADIUS = CARD_RADIUS;

// Twists: the Twist button flips the top card over to show them on its back.
const FLIP_MS = 450;
// While flipped, a twist slides this far out (fading) and the next one slides in.
const TWIST_SLIDE = 40;
const TWIST_OUT_MS = 110;
const TWIST_IN_MS = 170;
// How much the card swells at the midpoint of a flip.
const FLIP_LIFT = 0.06;

const SWIPE_MS = 320;
// Fraction of the screen width a drag must cover to change prompts (or a quick flick),
// matching the Welcome Tutorial's deck.
const SWIPE_THRESHOLD = 0.22;
const FLICK_VELOCITY = 0.5;
// Card edge tap zones stop this far from the top and bottom, clear of the header and
// footer buttons.
const CARD_EDGE_ZONE_INSET = 64;
// Page-turn tap feedback: a soft gradient that flashes in from the tapped side of the
// screen, strongest at the edge and fading out toward the card.
const TAP_FLASH_IN_MS = 90;
const TAP_FLASH_OUT_MS = 380;
const TAP_FLASH_LIGHT = 'rgba(0, 0, 0, 0.04)'; // a slightly darker shade in light mode
const TAP_FLASH_DARK = 'rgba(255, 255, 255, 0.06)'; // slightly lighter in dark mode

// Resting offsets of the deck's slots, top card first. During a skip the top card
// flies off and each card below moves up one slot. The steps shrink with depth
// (6px/1.5°, then 4px/0.9°, then 2px/0.6°), so most of the motion is at the top and
// the bottom of the deck barely stirs.
const SLOT_Y = [0, 6, 10, 12];
const SLOT_ROTATE = [0, -1.5, -0.6, 0];
const SLOTS = SLOT_Y.map((_, i) => i);
const DEEPEST_SLOT = SLOTS.length - 1;
// The deck never runs out: a card is mounted one slot past the deepest, invisible,
// and fades in as the others move up.
const SPAWN_DEPTH = SLOTS.length;
// Every card casts a shadow, sized by its slot: short and tight near the bottom of
// the deck, growing to the full card shadow as it rises to the top.
const SHADOW_SIZE = [1, 0.5, 0.3, 0.15];
const SHADOW_STRENGTH = [1, 0.85, 0.7, 0.55];

type ShadowBase = { opacity: number; radius: number; offsetY: number; elevation: number };

const deckShadow = (slot: number, base: ShadowBase) => {
  'worklet';
  const size = interpolate(slot, SLOTS, SHADOW_SIZE, 'clamp');
  return {
    shadowOpacity: base.opacity * interpolate(slot, SLOTS, SHADOW_STRENGTH, 'clamp'),
    shadowRadius: base.radius * size,
    shadowOffset: { width: 0, height: base.offsetY * size },
    elevation: base.elevation * size,
  };
};

type DeckSource = 'official' | 'user';

const SOURCE_LABEL: Record<PromptSource, string> = {
  official: 'What If Originals',
  community: 'Community',
  user: 'My Prompts',
};

const restingTransform = (slot: number, shadow: ShadowBase) => ({
  ...deckShadow(slot, shadow),
  transform: [{ translateY: SLOT_Y[slot] }, { rotate: `${SLOT_ROTATE[slot]}deg` }],
});

/**
 * One prompt card in the deck. Each card keeps the same prompt for as long as it's
 * mounted; only `progress` (the deck position, in prompt indexes) moves it. Where the
 * card sits relative to the position decides how it looks:
 *   - behind the top (d > 0): in a deck slot, its shadow sized to match; one slot
 *     past the deepest it's fully transparent, and fades in as it arrives;
 *   - on top (d = 0): the current prompt;
 *   - passed (-1 < d < 0): flying off to the left (or back in, when going back).
 */
const DeckCard = ({
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
  // Where the card sits in the deck (see above), before any flip.
  const deckCardStyle = () => {
    'worklet';
    const p = progress.value;
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
    const flipped = flip ? flip.value : 0;
    const placed = deckCardStyle();
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
      <View style={localStyles.stackCardClip}>{children}</View>
    </Animated.View>
  );
};

type Sheet = 'situation' | 'discussion' | 'report' | 'source' | null;

const REPORT_REASONS: { reason: ReportReason; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { reason: 'inappropriate', label: 'Not appropriate', icon: 'alert-triangle' },
  { reason: 'wrong-age', label: 'Wrong for this age group', icon: 'users' },
  { reason: 'confusing', label: 'Confusing or unclear', icon: 'help-circle' },
  { reason: 'other', label: 'Something else', icon: 'more-horizontal' },
];

export const PromptScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const route = useRoute<RouteProp<PromptsStackParamList, 'PromptsMain'>>();
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  const { width: windowWidth } = useWindowDimensions();
  const accent = surface.accent;

  const { activeContext } = useActiveContext();
  // Each app launch starts on the title card. The age group starts as the user's
  // preferred range (Settings), if any; otherwise they pick one when starting.
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(
    (route.params?.ageGroup as AgeGroupId | undefined) ?? activeContext.ageGroupDefault ?? null,
  );
  const [sessionStarted, setSessionStarted] = useState(!!route.params?.ageGroup);

  // A preference changed in Settings before the session starts applies right away.
  const preferredAge = activeContext.ageGroupDefault;
  useEffect(() => {
    if (!sessionStarted) setSelectedAge(preferredAge);
    // Only react to preference changes, not to the session starting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredAge]);
  const [ageMenuOpen, setAgeMenuOpen] = useState(false);
  const [liminalSpace, setLiminalSpace] = useState<string | null>(
    route.params?.liminalSpace ?? null,
  );
  // Which prompts the deck deals: the What If Originals library, or the user's own
  // (chosen from the card's source label, or sent here from Create).
  const [deckSource, setDeckSource] = useState<DeckSource>(route.params?.source ?? 'official');
  const [reloadKey, setReloadKey] = useState(0);

  // Opened from elsewhere (e.g. "Play in deck" after writing a prompt): show those
  // prompts, for that age group, in any situation, and load them fresh.
  const opened = route.params?.opened;
  useEffect(() => {
    if (!opened) return;
    const params = route.params;
    if (params?.source) setDeckSource(params.source);
    if (params?.ageGroup) setSelectedAge(params.ageGroup as AgeGroupId);
    setLiminalSpace(null);
    setSessionStarted(true);
    setReloadKey(opened);
    // Only react to a new request, identified by `opened`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);
  // The deck counts prompts without bound (wrapped with % to pick the prompt), so
  // each card in the deck has its own index even when there's a single prompt.
  // currentPromptIndex is the prompt that has settled on top; deckTarget is where
  // the deck is heading (ahead of it while cards are still flying).
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [deckTarget, setDeckTarget] = useState(0);
  const [showTwists, setShowTwists] = useState(false);
  const [twistIndex, setTwistIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);

  const { prompts, loading } = usePromptsForAge(selectedAge ?? '3-5', {
    liminalSpace: liminalSpace ?? undefined,
    source: deckSource,
    reloadKey,
  });
  const { isFavorited, toggle: toggleFavorite } = useFavorites();
  const spaces = useLiminalSpaces();
  const categories = useCategories();

  const currentAgeGroup = findAgeGroup(selectedAge);
  const currentSpace = spaces.find(s => s.id === liminalSpace);

  const safeIndex = prompts.length > 0 ? currentPromptIndex % prompts.length : 0;
  const currentPrompt = prompts[safeIndex];
  const promptAt = (index: number) => prompts[index % prompts.length];
  // Swiping right goes back through prompts already seen this session.
  const canGoBack = deckTarget > 0;
  const promptId = currentPrompt?.id ?? '';
  const { cards: twistCards } = useWorldBuilding(promptId);
  const hasTwists = twistCards.length > 0;
  const twist = twistCards[Math.min(twistIndex, twistCards.length - 1)];

  // Flip the top card over to its twists, and back. With Reduce Motion on, the faces
  // just swap.
  const reduceMotion = useReduceMotion();
  const flip = useSharedValue(0);
  useEffect(() => {
    flip.value = withTiming(showTwists ? 1 : 0, {
      duration: reduceMotion ? 0 : FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [showTwists, reduceMotion, flip]);
  // Each face shows for its half of the turn; they swap when the card is edge-on.
  const frontFaceStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 1 : 0 }));
  const backFaceStyle = useAnimatedStyle(() => ({ opacity: flip.value >= 0.5 ? 1 : 0 }));

  // Moving between twists: the current one slides out and fades, then the next
  // slides in from the other side.
  const twistShift = useSharedValue(0);
  const showTwist = (next: number, dir: number) => {
    setTwistIndex(next);
    twistShift.value = dir * TWIST_SLIDE;
    twistShift.value = withTiming(0, { duration: TWIST_IN_MS, easing: Easing.out(Easing.quad) });
  };
  const changeTwist = (dir: 1 | -1) => {
    const next = twistIndex + dir;
    if (next < 0 || next >= twistCards.length) {
      twistShift.value = withTiming(0, { duration: TWIST_IN_MS });
      return;
    }
    twistShift.value = withTiming(
      -dir * TWIST_SLIDE,
      { duration: TWIST_OUT_MS, easing: Easing.in(Easing.quad) },
      finished => {
        if (finished) runOnJS(showTwist)(next, dir);
      },
    );
  };
  const { total: tipCount } = useTipsForPrompt(promptId);

  // The deck position, in prompt indexes: whole numbers at rest, fractional while a
  // card is moving. Every card's motion is derived from it, so no card ever swaps
  // its prompt mid-animation.
  const progress = useSharedValue(0);
  const targetRef = useRef(0);
  const animatingRef = useRef(false);

  const personalization = usePersonalization();
  const [ttsEnabled] = useTtsEnabled();
  const [speaking, setSpeaking] = useState(false);

  // Stop reading aloud when the prompt changes or the screen goes away. A new prompt
  // also starts face up, at its first twist.
  useEffect(() => {
    setShowTwists(false);
    setTwistIndex(0);
    Speech.stop();
    setSpeaking(false);
  }, [promptId]);
  useEffect(() => () => void Speech.stop(), []);

  const toggleListen = () => {
    if (!currentPrompt) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const done = () => setSpeaking(false);
    Speech.speak(`${applyTokens(currentPrompt.text, personalization)} ${currentPrompt.fullQuestion}`, {
      language: 'en-US',
      rate: 0.95,
      onDone: done,
      onStopped: done,
      onError: done,
    });
    setSpeaking(true);
  };

  // Start the deck over when filters change so we don't end up on an out-of-range prompt
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    targetRef.current = 0;
    animatingRef.current = false;
    setDeckTarget(0);
    setCurrentPromptIndex(0);
  }, [liminalSpace, selectedAge, deckSource, reloadKey, progress]);

  const chooseSource = (source: DeckSource) => {
    setSheet(null);
    setDeckSource(source);
  };
  const openPromptEditor = () =>
    navigation
      .getParent()
      ?.navigate('Create', { screen: 'PromptEditor', params: { ageGroup: selectedAge ?? undefined } });

  const shadowBase: ShadowBase = {
    opacity: surface.shadow.shadowOpacity,
    radius: surface.shadow.shadowRadius,
    offsetY: surface.shadow.shadowOffset.height,
    elevation: surface.shadow.elevation,
  };

  const category = categories.find(c => c.id === currentPrompt?.categoryId);
  const favorited = isFavorited(promptId);

  const settle = (index: number) => {
    animatingRef.current = false;
    setCurrentPromptIndex(index);
  };

  /**
   * Moves the deck to `target`. Calls stack up: a second swipe while a card is still
   * flying retargets the same animation, so quick swipes are never dropped.
   */
  const goTo = (target: number) => {
    const t = Math.max(0, target);
    if (prompts.length === 0) return;
    if (t !== targetRef.current) setShowTwists(false);
    // From rest, a skip accelerates away; mid-flight, or going back, it eases in.
    const easing =
      !animatingRef.current && t > targetRef.current ? Easing.in(Easing.quad) : Easing.out(Easing.quad);
    targetRef.current = t;
    animatingRef.current = true;
    setDeckTarget(t);
    progress.value = withTiming(t, { duration: SWIPE_MS, easing }, finished => {
      if (finished) runOnJS(settle)(t);
    });
  };
  const handleSkip = () => goTo(targetRef.current + 1);
  const handleBack = () => {
    if (targetRef.current > 0) goTo(targetRef.current - 1);
  };

  // Dragging the card: left skips to the next prompt, right brings back the previous
  // one. A drag can start mid-flight; it picks the deck up where it is. The responder
  // is created once, so it reads the latest handlers from a ref.
  const dragStart = useRef(0);
  const gesture = useRef({
    grant: () => {},
    move: (_dx: number) => {},
    release: (_dx: number, _vx: number) => {},
  });
  // While the card is flipped, swiping it moves between twists instead; the prompt
  // deck stays put.
  gesture.current = {
    grant: () => {
      if (showTwists) return;
      cancelAnimation(progress);
      dragStart.current = progress.value;
    },
    move: dx => {
      if (showTwists) {
        twistShift.value = Math.max(-TWIST_SLIDE, Math.min(TWIST_SLIDE, dx * 0.35));
        return;
      }
      let p = dragStart.current - dx / windowWidth;
      // Rubber-band before the first prompt, and never more than one card ahead.
      if (p < 0) p = p / 3;
      progress.value = Math.min(p, targetRef.current + 1);
    },
    release: (dx, vx) => {
      const forward = dx < -windowWidth * SWIPE_THRESHOLD || vx < -FLICK_VELOCITY;
      const back = dx > windowWidth * SWIPE_THRESHOLD || vx > FLICK_VELOCITY;
      if (showTwists) {
        if (forward || back) changeTwist(forward ? 1 : -1);
        else twistShift.value = withTiming(0, { duration: TWIST_IN_MS });
        return;
      }
      if (forward) handleSkip();
      else if (back && targetRef.current > 0) handleBack();
      else goTo(targetRef.current);
    },
  };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => gesture.current.grant(),
      onPanResponderMove: (_, g) => gesture.current.move(g.dx),
      onPanResponderRelease: (_, g) => gesture.current.release(g.dx, g.vx),
      onPanResponderTerminate: () => gesture.current.release(0, 0),
    }),
  ).current;

  // Tapping a page-turn zone flashes that side of the screen, but only when the tap
  // actually turns the page (not "back" from the first prompt).
  const flashLeft = useSharedValue(0);
  const flashRight = useSharedValue(0);
  const flash = (side: SharedValue<number>) => {
    side.value = withSequence(
      withTiming(1, { duration: TAP_FLASH_IN_MS, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: TAP_FLASH_OUT_MS, easing: Easing.in(Easing.quad) }),
    );
  };
  const tapBack = () => {
    if (targetRef.current === 0) return;
    flash(flashLeft);
    handleBack();
  };
  const tapForward = () => {
    if (prompts.length === 0) return;
    flash(flashRight);
    handleSkip();
  };
  const flashLeftStyle = useAnimatedStyle(() => ({ opacity: flashLeft.value }));
  const flashRightStyle = useAnimatedStyle(() => ({ opacity: flashRight.value }));
  const flashTint = isDark ? TAP_FLASH_DARK : TAP_FLASH_LIGHT;
  const flashClear = isDark ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)';
  // Midpoint of an eased falloff, so the glow hugs the edge rather than fading evenly.
  const flashMid = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.0125)';

  const handleReport = () => setSheet('report');

  const sendReport = async (reason: ReportReason) => {
    setSheet(null);
    if (!currentPrompt) return;
    try {
      const result = await submitPromptReport(currentPrompt.id, reason);
      if (result === 'unavailable') {
        Alert.alert(
          'Thanks for flagging it',
          'Reports can’t be sent from this version yet. Please send a note through TestFlight feedback (a screenshot helps) so we can review this prompt.',
        );
      } else {
        Alert.alert(
          'Thanks for flagging it',
          result === 'sent'
            ? 'We’ll review this prompt.'
            : 'Your report will be sent when you’re back online.',
        );
      }
    } catch {
      Alert.alert('Couldn’t send the report', 'Please try again, or use TestFlight feedback.');
    }
  };

  // Picking an age from the menu also starts the session if it hasn't started yet.
  const handleSelectAge = (id: AgeGroupId) => {
    setSelectedAge(id);
    setSessionStarted(true);
    setAgeMenuOpen(false);
  };

  const handleStartSession = () => {
    if (selectedAge) setSessionStarted(true);
    else setAgeMenuOpen(true);
  };

  // Cards behind the top one are the same color; the top card's drop shadow is what
  // darkens their peeking edges, so nothing changes color when a card moves up.
  const stackCardStyle = {
    backgroundColor: surface.card,
    borderColor: surface.border,
    shadowColor: surface.shadow.shadowColor,
  };

  // Cards mounted in the deck: the one to go back to, the top card, and the slots
  // below it plus one invisible spare at the bottom. While cards are flying, this
  // spans both where the deck has settled and where it's heading.
  const deckFirst = Math.max(0, Math.min(currentPromptIndex, deckTarget) - 1);
  const deckLast = Math.max(currentPromptIndex, deckTarget) + SPAWN_DEPTH;
  const deckIndexes: number[] = [];
  for (let i = deckLast; i >= deckFirst; i--) deckIndexes.push(i);

  const renderBody = () => {
    if (!sessionStarted) {
      // Title card shown until an age group is picked.
      return (
        <ScrollView
          style={localStyles.scroll}
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={localStyles.deck}>
            {[3, 2, 1].map(slot => (
              <View
                key={slot}
                style={[localStyles.stackCard, stackCardStyle, restingTransform(slot, shadowBase)]}
              />
            ))}
            <View
              style={[
                localStyles.card,
                localStyles.titleCard,
                { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
              ]}
            >
              <Text style={[localStyles.titleMark, { color: accent }]}>?</Text>
              <Text style={[localStyles.titleText, { color: accent }]}>What If?</Text>
              <Text style={[localStyles.titleSubtitle, { color: colors.textSecondary }]}>
                {currentAgeGroup
                  ? `Start a session to get your first prompt for ages ${currentAgeGroup.label.replace(' years', '').replace('-', ' – ')}.`
                  : "Start a session and choose who you're talking with to get your first prompt."}
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    if (loading || !currentPrompt) {
      return (
        <View style={localStyles.emptyState}>
          {loading ? (
            <ActivityIndicator size="large" color={PINK} />
          ) : deckSource === 'user' ? (
            <>
              <Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>
                {liminalSpace
                  ? "None of your prompts fit this age group and situation yet."
                  : "You haven't made any prompts for this age group yet."}
              </Text>
              <View style={localStyles.emptyActions}>
                <Button label="Write a prompt" icon="edit-3" onPress={openPromptEditor} />
                <Button
                  label="Show What If Originals"
                  variant="secondary"
                  onPress={() => chooseSource('official')}
                />
              </View>
            </>
          ) : (
            <Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>
              No prompts match these filters. Try a different age group or situation.
            </Text>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={localStyles.scroll}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page-turn zones, like an ebook: tapping the empty space left of center goes
            back, right of center goes forward. They sit behind the card, so taps on
            the card and its buttons never reach them. Hidden from VoiceOver, which
            has the Previous prompt button's actions instead. */}
        <View
          style={localStyles.tapZones}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Pressable style={localStyles.tapZone} onPress={tapBack} />
          <Pressable style={localStyles.tapZone} onPress={tapForward} />
        </View>

        <View style={localStyles.deck} {...pan.panHandlers}>
          {/* The deck, deepest card first so the top card draws last. Cards are keyed
              by their place in the deck, so each keeps its prompt from the moment it
              fades in at the bottom until it has flown off and is removed. */}
          {deckIndexes.map(index => {
            const prompt = promptAt(index);
            const isCurrent = index === currentPromptIndex;
            return (
              <DeckCard
                key={index}
                index={index}
                progress={progress}
                width={windowWidth}
                shadow={shadowBase}
                interactive={isCurrent}
                flip={isCurrent ? flip : undefined}
                style={[localStyles.stackCard, stackCardStyle]}
              >
                {isCurrent ? (
                  <>
                    <Animated.View
                      style={[localStyles.cardFace, frontFaceStyle]}
                      pointerEvents={showTwists ? 'none' : 'auto'}
                      accessibilityElementsHidden={showTwists}
                      importantForAccessibility={showTwists ? 'no-hide-descendants' : 'auto'}
                    >
                      <PromptCardContent
                        prompt={prompt}
                        category={category}
                        accent={accent}
                        tipCount={tipCount}
                        onReport={handleReport}
                        onDiscussion={() => setSheet('discussion')}
                        showListen={ttsEnabled}
                        speaking={speaking}
                        onListen={toggleListen}
                        onSourcePress={() => setSheet('source')}
                      />
                    </Animated.View>
                    {twist && (
                      <Animated.View
                        style={[localStyles.cardFace, backFaceStyle]}
                        pointerEvents={showTwists ? 'auto' : 'none'}
                        accessibilityElementsHidden={!showTwists}
                        importantForAccessibility={showTwists ? 'auto' : 'no-hide-descendants'}
                      >
                        <TwistCardContent
                          card={twist}
                          index={twistIndex}
                          count={twistCards.length}
                          fullQuestion={prompt.fullQuestion}
                          accent={accent}
                          shift={twistShift}
                          onPrev={() => changeTwist(-1)}
                          onNext={() => changeTwist(1)}
                        />
                      </Animated.View>
                    )}
                  </>
                ) : (
                  <PromptCardContent
                    prompt={prompt}
                    category={categories.find(c => c.id === prompt.categoryId)}
                    accent={accent}
                    showListen={ttsEnabled}
                  />
                )}
              </DeckCard>
            );
          })}

          {/* The page-turn zones continue onto the card's outer edges, between the
              header (flag) and footer (Listen, Tips) so those buttons stay clear. They
              belong to the deck, not a card, so a quick second tap still lands while
              the first card is flying off. */}
          {/* Face up only: on the twist side the card's own arrows take over. */}
          {!showTwists && (
            <View
              style={localStyles.cardEdgeZones}
              pointerEvents="box-none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Pressable style={localStyles.cardEdgeZone} onPress={tapBack} />
              <Pressable style={localStyles.cardEdgeZone} onPress={tapForward} />
            </View>
          )}
        </View>

      </ScrollView>
    );
  };

  return (
    <Screen>
      {/* Tap feedback for the page-turn zones: full screen height so it has no hard
          top or bottom edge. Drawn first, so it sits behind the cards and controls. */}
      <Animated.View
        pointerEvents="none"
        style={[localStyles.tapFlash, localStyles.tapFlashLeft, flashLeftStyle]}
      >
        <LinearGradient
          colors={[flashTint, flashMid, flashClear]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[localStyles.tapFlash, localStyles.tapFlashRight, flashRightStyle]}
      >
        <LinearGradient
          colors={[flashClear, flashMid, flashTint]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <ScreenHeader title="What If?" />

      <View style={localStyles.filterArea}>
        <View style={localStyles.filterRow}>
          <Pill
            dropdown
            onPress={() => setAgeMenuOpen(o => !o)}
            leading={currentAgeGroup ? <Dot color={currentAgeGroup.bgColor} /> : undefined}
            icon={currentAgeGroup ? undefined : 'users'}
            label={currentAgeGroup?.label.replace('-', ' – ') ?? 'Age group'}
          />
          <Pill
            dropdown
            onPress={() => setSheet('situation')}
            leading={
              <Feather
                name={(currentSpace?.icon as keyof typeof Feather.glyphMap) ?? 'globe'}
                size={14}
                color={colors.iconDefault}
              />
            }
            label={currentSpace?.name ?? 'Anywhere'}
          />
        </View>

        {/* Age picker that drops down from the age pill, over the card */}
        {ageMenuOpen && (
          <Animated.View
            entering={FadeInDown.duration(180)}
            exiting={FadeOutUp.duration(120)}
            style={[
              localStyles.ageMenu,
              { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
            ]}
          >
            <Text style={[localStyles.ageMenuTitle, { color: colors.textSecondary }]}>
              WHO ARE YOU TALKING WITH?
            </Text>
            {ageGroups.map((g, i) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => handleSelectAge(g.id)}
                style={[
                  localStyles.ageOption,
                  i < ageGroups.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: surface.border,
                  },
                ]}
                accessibilityLabel={`Ages ${g.label}`}
              >
                <Dot color={g.bgColor} size={12} />
                <Text style={[localStyles.ageOptionText, { color: colors.textPrimary }]}>
                  {g.label.replace('-', ' – ')}
                </Text>
                {g.id === selectedAge && <Feather name="check" size={18} color={PINK} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      {renderBody()}

      {!sessionStarted && (
        <View style={localStyles.startRow}>
          <Button label="Start a session" icon="play" onPress={handleStartSession} />
        </View>
      )}

      {sessionStarted && currentPrompt && !loading && (
        <View style={localStyles.actionRow}>
          {/* Back to the previous prompt (swiping the card left skips forward). VoiceOver
              users can't swipe the card, so both directions are also actions here. */}
          <TouchableOpacity
            onPress={handleBack}
            style={[
              localStyles.circleButton,
              { borderColor: surface.border, backgroundColor: surface.card },
              !canGoBack && localStyles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous prompt"
            accessibilityHint={
              canGoBack
                ? 'Goes back to the prompt before this one. Swipe up or down for more actions.'
                : 'This is the first prompt. Swipe up or down for more actions.'
            }
            accessibilityState={{ disabled: !canGoBack }}
            accessibilityActions={[
              { name: 'activate' },
              { name: 'next', label: 'Next prompt' },
              { name: 'previous', label: 'Previous prompt' },
            ]}
            onAccessibilityAction={e => {
              if (e.nativeEvent.actionName === 'next') handleSkip();
              else handleBack();
            }}
          >
            <Feather name="rotate-ccw" size={22} color={colors.iconDefault} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowTwists(p => !p)}
            disabled={!hasTwists}
            style={[
              localStyles.circleButton,
              localStyles.twistButton,
              {
                borderColor: accent,
                backgroundColor: showTwists ? accent : surface.card,
              },
              !hasTwists && localStyles.disabled,
            ]}
            accessibilityLabel={showTwists ? 'Show the prompt' : 'Flip to twists'}
          >
            <Feather name="shuffle" size={20} color={showTwists ? '#fff' : accent} />
            <Text style={[localStyles.twistLabel, { color: showTwists ? '#fff' : accent }]}>
              Twist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(promptId)}
            style={[
              localStyles.circleButton,
              { borderColor: PINK, backgroundColor: favorited ? PINK : surface.card },
            ]}
            accessibilityLabel={favorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Feather name="heart" size={22} color={favorited ? '#fff' : PINK} />
          </TouchableOpacity>
        </View>
      )}

      <BottomSheet visible={sheet === 'source'} title="Show prompts from" onClose={() => setSheet(null)}>
        <SheetOption
          label="What If Originals"
          selected={deckSource === 'official'}
          leading={<Ionicons name="sparkles-outline" size={16} color={colors.iconDefault} />}
          onPress={() => chooseSource('official')}
        />
        <SheetOption
          label="My Prompts"
          selected={deckSource === 'user'}
          leading={<Ionicons name="folder-outline" size={16} color={colors.iconDefault} />}
          onPress={() => chooseSource('user')}
        />
      </BottomSheet>

      <BottomSheet visible={sheet === 'situation'} title="Right now we're…" onClose={() => setSheet(null)}>
        <SheetOption
          label="Anywhere"
          selected={liminalSpace === null}
          leading={<Feather name="globe" size={16} color={colors.iconDefault} />}
          onPress={() => {
            setLiminalSpace(null);
            setSheet(null);
          }}
        />
        {spaces.map(s => (
          <SheetOption
            key={s.id}
            label={s.name}
            selected={s.id === liminalSpace}
            leading={
              <Feather
                name={(s.icon as keyof typeof Feather.glyphMap) ?? 'circle'}
                size={16}
                color={colors.iconDefault}
              />
            }
            onPress={() => {
              setLiminalSpace(s.id);
              setSheet(null);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'discussion'} title="Discussion tips" onClose={() => setSheet(null)}>
        <ScrollView style={localStyles.discussionScroll}>
          <DiscussionTips promptId={promptId} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'report'}
        title="What’s wrong with this prompt?"
        onClose={() => setSheet(null)}
      >
        {REPORT_REASONS.map(r => (
          <SheetOption
            key={r.reason}
            label={r.label}
            leading={<Feather name={r.icon} size={16} color={colors.iconDefault} />}
            onPress={() => sendReport(r.reason)}
          />
        ))}
      </BottomSheet>


      {/* Tap outside the age picker to close it; sits under the pills and menu */}
      {ageMenuOpen && (
        <Pressable
          style={[StyleSheet.absoluteFill, localStyles.menuBackdrop]}
          onPress={() => setAgeMenuOpen(false)}
          accessibilityLabel="Close age picker"
        />
      )}
    </Screen>
  );
};

/* ============ Small building blocks ============ */

/**
 * The inside of a prompt card. Used for the live top card and, without handlers,
 * for the next prompt peeking out underneath it.
 */
// Every prompt card is the same height. Prompt text starts at the title size and
// shrinks to fit, down to a floor that's still easy to read aloud; text that doesn't
// fit even then is cut off (see TESTFLIGHT_CHECKLIST.md on long prompts).
// The card grows upward only: CARD_GROW is added to the height and to the padding
// under the deck, which keeps the bottom edge where a 340pt card's would be while the
// top reaches toward the filter pills.
const CARD_GROW = 40;
const CARD_HEIGHT = 340 + CARD_GROW;
const PROMPT_FONT_MAX = Typography.title1;
const PROMPT_FONT_MIN = Typography.title3;
// Inset of everything on the card from its edges: tighter top and bottom than sides.
const CARD_PADDING_X = Spacing.lg;
const CARD_PADDING_Y = Spacing.md;
// Fixed gap between the follow-up question and the Listen / Tips row.
const QUESTION_TO_FOOTER = Spacing.md;
const promptLineHeight = (fontSize: number) => Math.round(fontSize * 1.25);

/**
 * Picks the largest prompt font size (between the max and min) at which the prompt
 * fits its area of the card, between the header and the follow-up question. The text
 * stays hidden until it fits, so it never visibly resizes. Text area grows with the
 * square of the font size, so each step jumps close to the answer and it settles in
 * two or three layouts.
 */
const useFitPromptText = (text: string) => {
  const [fit, setFit] = useState<{
    text: string;
    fontSize: number;
    fitted: boolean;
    maxLines?: number;
  }>({ text, fontSize: PROMPT_FONT_MAX, fitted: false });
  const available = useRef(0);
  const needed = useRef(0);

  // New text starts over at full size. Reset during render rather than in an effect,
  // so a layout that arrives first can't be undone by a late reset.
  let current = fit;
  if (fit.text !== text) {
    current = { text, fontSize: PROMPT_FONT_MAX, fitted: false };
    needed.current = 0;
    setFit(current);
  }
  const { fontSize, fitted, maxLines } = current;

  const check = () => {
    if (fitted || !available.current || !needed.current) return;
    if (needed.current <= available.current) {
      setFit({ text, fontSize, fitted: true });
      return;
    }
    if (fontSize <= PROMPT_FONT_MIN) {
      // Too long even at the smallest size: cut it off with an ellipsis at the last
      // line that fits.
      const lines = Math.floor(available.current / promptLineHeight(fontSize));
      setFit({ text, fontSize, fitted: true, maxLines: Math.max(1, lines) });
      return;
    }
    const estimate = Math.floor(fontSize * Math.sqrt(available.current / needed.current));
    needed.current = 0; // wait for the next attempt's own measurement
    setFit({
      text,
      fontSize: Math.max(PROMPT_FONT_MIN, Math.min(fontSize - 1, estimate)),
      fitted: false,
    });
  };

  return {
    fontSize,
    fitted,
    maxLines,
    /** Remounts the measured text for each attempt, so every attempt gets a layout. */
    attemptKey: `${text}:${fontSize}`,
    onAreaLayout: (e: LayoutChangeEvent) => {
      available.current = e.nativeEvent.layout.height;
      check();
    },
    onPromptLayout: (e: LayoutChangeEvent) => {
      needed.current = e.nativeEvent.layout.height;
      check();
    },
  };
};

/** Prompt-sized text, fitted to the space it's given (see useFitPromptText). */
const FittedPromptText = ({ text, color }: { text: string; color: string }) => {
  const { fontSize, fitted, maxLines, attemptKey, onAreaLayout, onPromptLayout } =
    useFitPromptText(text);
  return (
    <View style={localStyles.promptArea} onLayout={onAreaLayout}>
      <Text
        key={attemptKey}
        onLayout={onPromptLayout}
        numberOfLines={maxLines}
        style={[
          localStyles.promptText,
          { color, fontSize, lineHeight: promptLineHeight(fontSize) },
          !fitted && localStyles.unfitted,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const difficultyLabel = (difficulty: number) =>
  difficulty <= 1 ? 'Gentle' : difficulty === 2 ? 'Deeper' : 'Challenging';

/**
 * The back of the top card: one twist at a time, in place of the prompt. The pips
 * show which twist this is; the arrows (or swiping the card) move between them.
 * `shift` slides the twist text out and the next one in.
 */
const TwistCardContent = ({
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
      <View style={localStyles.cardHeader}>
        <View style={localStyles.sourceRow}>
          <Feather name="shuffle" size={14} color={accent} />
          <Text style={[localStyles.sourceText, { color: accent }]}>Twist</Text>
        </View>
        <Animated.View
          style={[
            localStyles.categoryPill,
            localStyles.difficultyPill,
            { borderColor: surface.border },
            pillStyle,
          ]}
        >
          {[1, 2, 3].map(level => (
            <View
              key={level}
              style={[
                localStyles.difficultyDot,
                { backgroundColor: level <= card.difficulty ? accent : surface.border },
              ]}
            />
          ))}
          <Text style={[localStyles.categoryText, { color: colors.textSecondary }]}>
            {difficultyLabel(card.difficulty).toUpperCase()}
          </Text>
        </Animated.View>
      </View>

      <View style={localStyles.cardBody}>
        <Animated.View style={[localStyles.twistTextSlot, textStyle]}>
          <FittedPromptText
            text={applyTokens(card.cardText, personalization)}
            color={colors.textPrimary}
          />
        </Animated.View>
        <Text style={[localStyles.fullQuestion, { color: colors.textSecondary }]}>
          {fullQuestion}
        </Text>
      </View>

      <View style={localStyles.twistFooter}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={!hasPrev}
          hitSlop={10}
          style={!hasPrev && localStyles.disabled}
          accessibilityLabel="Previous twist"
        >
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View
          style={localStyles.twistPips}
          accessible
          accessibilityLabel={`Twist ${index + 1} of ${count}`}
        >
          {Array.from({ length: count }, (_, i) => (
            <View
              key={i}
              style={[
                localStyles.twistPip,
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
          style={!hasNext && localStyles.disabled}
          accessibilityLabel="Next twist"
        >
          <Feather name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const PromptCardContent = ({
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
      <View style={localStyles.cardHeader}>
        <TouchableOpacity
          style={localStyles.sourceRow}
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
          <Text style={[localStyles.sourceText, { color: accent }]}>
            {SOURCE_LABEL[prompt.source]}
          </Text>
          <Feather name="chevron-down" size={14} color={accent} />
        </TouchableOpacity>
        <View style={localStyles.cardHeaderRight}>
          {category && (
            <View style={[localStyles.categoryPill, { borderColor: surface.border }]}>
              <Text style={[localStyles.categoryText, { color: colors.textSecondary }]}>
                {category.name.toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={onReport} hitSlop={8} accessibilityLabel="Report this prompt">
            <Feather name="flag" size={16} color={colors.iconDefault} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={localStyles.cardBody}>
        {/* The prompt is centered in the space left above the follow-up question. */}
        <FittedPromptText text={text} color={colors.textPrimary} />
        {/* Pinned a fixed distance above the Listen / Tips row on every card. */}
        <Text style={[localStyles.fullQuestion, { color: colors.textSecondary }]}>
          {prompt.fullQuestion}
        </Text>
      </View>

      <View style={localStyles.cardFooter}>
        {showListen ? (
          <TouchableOpacity
            style={localStyles.footerButton}
            onPress={onListen}
            accessibilityLabel={speaking ? 'Stop reading aloud' : 'Read this prompt aloud'}
          >
            <Feather name={speaking ? 'square' : 'volume-2'} size={16} color={colors.textPrimary} />
            <Text style={[localStyles.footerText, { color: colors.textPrimary }]}>
              {speaking ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[localStyles.footerButton, noTips && localStyles.disabled]}
          onPress={onDiscussion}
          disabled={noTips}
          accessibilityLabel="Discussion tips"
        >
          <Feather name="info" size={16} color={colors.textPrimary} />
          <Text style={[localStyles.footerText, { color: colors.textPrimary }]}>Tips</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

/* ============ Reflection modal (Deliverable #5) ============ */

const ReflectionModal = ({
  visible,
  promptId,
  contextId,
  onClose,
}: {
  visible: boolean;
  promptId: string;
  contextId: string;
  onClose: () => void;
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState<'choice' | 'reflect'>('choice');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setStep('choice');
      setNote('');
      setRating(null);
    }
  }, [visible]);

  const handleSave = async () => {
    if (note.trim() || rating !== null) {
      await ReflectionRepo.create({
        contextId,
        promptId,
        note: note.trim() || null,
        rating,
      });
    }
    onClose();
  };

  const ratingFaces = ['😞', '😐', '🙂', '😊', '🤩'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={localStyles.modalBackdrop}>
        <View style={[localStyles.modalCard, { backgroundColor: colors.cardBg }]}>
          {step === 'choice' ? (
            <>
              <Text style={[localStyles.modalTitle, { color: colors.textPrimary }]}>
                How did that go?
              </Text>
              <Text style={[localStyles.modalSubtitle, { color: colors.textSecondary }]}>
                Take a moment to capture what came up — or skip to the next prompt.
              </Text>
              <View style={localStyles.modalButtonRow}>
                <TouchableOpacity
                  style={[localStyles.modalButton, { backgroundColor: colors.bgMuted }]}
                  onPress={onClose}
                >
                  <Text style={[localStyles.modalButtonText, { color: colors.textPrimary }]}>
                    Skip
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[localStyles.modalButton, { backgroundColor: '#e10086' }]}
                  onPress={() => setStep('reflect')}
                >
                  <Text style={[localStyles.modalButtonText, { color: '#fff' }]}>Reflect</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[localStyles.modalTitle, { color: colors.textPrimary }]}>
                Reflect on the conversation
              </Text>
              <View style={localStyles.ratingRow}>
                {ratingFaces.map((face, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i + 1)}
                    style={[
                      localStyles.ratingButton,
                      rating === i + 1 && { backgroundColor: '#fdfb76' },
                    ]}
                  >
                    <Text style={localStyles.ratingFace}>{face}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  localStyles.noteInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="What did they say? What surprised you?"
                placeholderTextColor={colors.iconInactive}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />
              <View style={localStyles.modalButtonRow}>
                <TouchableOpacity
                  style={[localStyles.modalButton, { backgroundColor: colors.bgMuted }]}
                  onPress={onClose}
                >
                  <Text style={[localStyles.modalButtonText, { color: colors.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[localStyles.modalButton, { backgroundColor: '#e10086' }]}
                  onPress={handleSave}
                >
                  <Text style={[localStyles.modalButtonText, { color: '#fff' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  filterArea: {
    // Above the backdrop and the card so the age picker can drop down over them
    zIndex: 10,
    elevation: 10,
  },
  ageMenu: {
    position: 'absolute',
    top: 40,
    left: Spacing.lg,
    width: 270,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  ageMenuTitle: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  ageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  ageOptionText: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  menuBackdrop: {
    zIndex: 9,
    elevation: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  titleCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleMark: {
    fontSize: 72,
    lineHeight: 84,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    opacity: 0.15,
  },
  titleText: {
    fontSize: Typography.title1,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    textAlign: 'center',
  },
  titleSubtitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    textAlign: 'center',
  },
  startRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 108,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyActions: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: CARD_GROW,
  },
  tapZones: {
    // Spans the scroll content edge to edge, including its side padding.
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapZone: {
    flex: 1,
  },
  tapFlash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
  tapFlashLeft: {
    left: 0,
  },
  tapFlashRight: {
    right: 0,
  },
  cardEdgeZones: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CARD_EDGE_ZONE_INSET,
    bottom: CARD_EDGE_ZONE_INSET,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardEdgeZone: {
    width: '25%',
  },
  deck: {
    height: CARD_HEIGHT,
    marginBottom: CARD_MARGIN_BOTTOM,
    zIndex: 2,
  },
  // A card in the deck behind the top one. The clipping is on an inner layer
  // (stackCardClip), because clipping the card itself would also cut off its shadow.
  stackCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stackCardClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_CORNER_RADIUS,
    overflow: 'hidden',
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: CARD_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardBody: {
    // Fills the card between header and footer.
    flex: 1,
    paddingTop: Spacing.md,
    paddingBottom: QUESTION_TO_FOOTER,
  },
  // One side of the top card. Both sides fill the card; the flip shows one at a time.
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
  },
  twistTextSlot: {
    flex: 1,
  },
  difficultyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  twistFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  twistPips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twistPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  promptArea: {
    // The prompt text is fitted to this space.
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  unfitted: {
    opacity: 0,
  },
  promptText: {
    // fontSize and lineHeight are set per card by useFitPromptText.
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  fullQuestion: {
    marginTop: Spacing.sm,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-MediumItalic',
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.35,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twistButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    gap: 2,
  },
  twistLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  discussionScroll: {
    maxHeight: 420,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingFace: {
    fontSize: 28,
  },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    textAlignVertical: 'top',
  },
});
