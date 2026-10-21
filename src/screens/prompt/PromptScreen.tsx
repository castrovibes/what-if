import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
// Gesture Handler's ScrollView, so the deck's pan and the vertical scroll negotiate
// natively instead of through the JS responder system.
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { findAgeGroup, AgeGroupId } from '../../data/ageGroups';
import { DeckRequest, registerDeckHandler } from '../../navigation/deckLinks';
import { usePromptsForAge } from '../../hooks/usePromptsForAge';
import { useFavorites } from '../../hooks/useFavorites';
import { useWorldBuilding } from '../../hooks/useWorldBuilding';
import { useLiminalSpaces } from '../../hooks/useLiminalSpaces';
import { useCategories } from '../../hooks/useCategories';
import { useTipsForPrompt } from '../../hooks/useTipsForPrompt';
import { useTtsEnabled } from '../../hooks/useTtsEnabled';
import { useActiveContext } from '../../providers/ActiveContextProvider';
import { ReportReason, submitPromptReport } from '../../backend/reports';
import { Prompt } from '../../db/types';
import { PromptsStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { useSurface, PINK } from '../../ui/surface';
import { useReduceMotion } from '../../navigation/transitions';
import { Screen, ScreenHeader, Pill, Dot, Button } from '../../ui/components';
import {
  ACTION_FADE_MS,
  ARRIVAL_DELAY_MS,
  ARRIVAL_FADE_MS,
  CARD_CORNER_RADIUS,
  CARD_EDGE_ZONE_INSET,
  CARD_GROW,
  CARD_HEIGHT,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING_X,
  CARD_PADDING_Y,
  DeckSource,
  FLICK_VELOCITY,
  FLIP_MS,
  SPAWN_DEPTH,
  SWIPE_MS,
  SWIPE_THRESHOLD,
  Sheet,
  ShadowBase,
  TITLE_DECK_INDEXES,
  TWIST_IN_MS,
  TWIST_OUT_MS,
  TWIST_SLIDE,
  actionEntering,
} from './deck';
import { DeckCard } from './DeckCard';
import { PromptCardContent } from './PromptCardContent';
import { TwistCardContent } from './TwistCardContent';
import { TapFlash, useTapFlash } from '../../ui/TapFlash';
import { usePromptSpeech } from './usePromptSpeech';
import { AgeMenu, AgeMenuBackdrop, AgePickCard } from './AgeMenu';
import { PromptSheets } from './PromptSheets';
import { ReflectionSheet, REFLECT_AFTER_MS } from './ReflectionSheet';
import { EndOfDeckCard } from './EndOfDeckCard';
import { toast } from '../../ui/toast';
import { haptic } from '../../ui/haptics';
import { HintBubble } from '../../ui/HintBubble';
import { useOneTimeHint } from '../../hooks/useOneTimeHint';
import { useTabBarInset } from '../../navigation/tabBarInset';

// A horizontal drag becomes a swipe after this much movement; more vertical than
// that and the scroll view keeps it. (Replaces the old responder's dx > dy * 1.5.)
const SWIPE_ACTIVATE_PX = 8;
const SWIPE_FAIL_Y_PX = 12;

// The title card shows the launch graphic: "What If?" arched over the hand-drawn question
// mark (built by tools/graphics/make_splash.py, also on the Welcome and loading screens).
const TITLE_ART = {
  light: require('../../../assets/graphics/splash-light.png'),
  dark: require('../../../assets/graphics/splash-dark.png'),
};
const TITLE_ART_WIDTH = 220;
const titleArtAsset = Image.resolveAssetSource(TITLE_ART.light);
const TITLE_ART_HEIGHT = (TITLE_ART_WIDTH * titleArtAsset.height) / titleArtAsset.width;
// First-time hints float just above the action row (its 76pt Twist button plus padding).
const HINT_BOTTOM = 76 + Spacing.md * 2 + Spacing.sm;

/**
 * The prompt deck: a title card before a session, then prompt cards the user swipes
 * (or taps) through, each with twists on its back. The pieces live alongside this
 * file in src/screens/prompt/; this component owns the deck's state and gestures.
 *
 * Swipes run on the UI thread (Gesture Handler + Reanimated): the drag updates shared
 * values directly, and only the decision at release (skip, back, snap, next twist)
 * comes back to JS.
 */
export const PromptScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const route = useRoute<RouteProp<PromptsStackParamList, 'PromptsMain'>>();
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  const { width: windowWidth } = useWindowDimensions();
  const accent = surface.accent;
  // The floating tab bar covers the bottom of the screen; the action row stays above it.
  const tabInset = useTabBarInset();

  const { activeContext } = useActiveContext();
  // With a preferred age range (Settings), or sent here for a specific age, the deck
  // opens straight onto the first prompt. Otherwise it opens on the title card and
  // the user picks who they're talking with.
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(
    (route.params?.ageGroup as AgeGroupId | undefined) ?? activeContext.ageGroupDefault ?? null,
  );
  const [sessionStarted, setSessionStarted] = useState(
    !!route.params?.ageGroup || !!activeContext.ageGroupDefault,
  );

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

  // Opened with route params before this screen had registered its deck handler (see
  // deckLinks.ts): apply the same request.
  const opened = route.params?.opened;
  useEffect(() => {
    if (!opened) return;
    const params = route.params;
    applyDeckRequest({
      source: params?.source ?? 'user',
      ageGroup: (params?.ageGroup as AgeGroupId | undefined) ?? selectedAge ?? '3-5',
      promptId: params?.promptId,
    });
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

  // The deck runs from the first prompt to an end card one past the last (index
  // prompts.length); `promptAt` is undefined there. The deck never wraps around.
  const endIndex = prompts.length;
  const promptAt = (index: number) => (index < prompts.length ? prompts[index] : undefined);
  const currentPrompt = promptAt(currentPromptIndex);
  // Mirror for the drag worklet, which rubber-bands past the end card.
  const endSV = useSharedValue(0);
  useEffect(() => {
    endSV.value = endIndex;
  }, [endIndex, endSV]);
  // Swiping right goes back through prompts already seen this session.
  const canGoBack = deckTarget > 0;
  const promptId = currentPrompt?.id ?? '';
  const { cards: twistCards, loading: twistsLoading } = useWorldBuilding(promptId);
  const hasTwists = twistCards.length > 0;
  // The Twist button is hidden (not dimmed) for prompts without twists. While a new
  // prompt's twists load it stays put, so it doesn't blink out and back on every swipe.
  const showTwistButton = hasTwists || twistsLoading;
  const twist = twistCards[Math.min(twistIndex, twistCards.length - 1)];
  const toggleTwists = () => {
    if (!hasTwists) return;
    haptic.medium();
    twistHint.dismiss();
    setShowTwists(p => !p);
  };

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
    haptic.selection();
    twistShift.value = withTiming(
      -dir * TWIST_SLIDE,
      { duration: TWIST_OUT_MS, easing: Easing.in(Easing.quad) },
      finished => {
        if (finished) runOnJS(showTwist)(next, dir);
      },
    );
  };
  const { total: tipCount } = useTipsForPrompt(promptId);

  // First-time hints, in place of a tutorial: Twist introduces itself the first time a
  // prompt with twists is on top, then Tips the first time a prompt has tips. Each
  // shows once per install and goes when tapped or when the feature is used.
  const twistHint = useOneTimeHint('twist');
  const tipsHint = useOneTimeHint('tips');
  const openDiscussion = () => {
    tipsHint.dismiss();
    setSheet('discussion');
  };

  // The deck position, in prompt indexes: whole numbers at rest, fractional while a
  // card is moving. Every card's motion is derived from it, so no card ever swaps
  // its prompt mid-animation.
  const progress = useSharedValue(0);
  const targetRef = useRef(0);
  const animatingRef = useRef(false);
  // Mirrors of JS state for the gesture worklets (which can't read React state).
  const targetSV = useSharedValue(0);
  const showTwistsSV = useSharedValue(false);
  useEffect(() => {
    showTwistsSV.value = showTwists;
  }, [showTwists, showTwistsSV]);

  const [ttsEnabled] = useTtsEnabled();
  const { speaking, toggleListen } = usePromptSpeech(currentPrompt);

  // A new prompt starts face up, at its first twist.
  useEffect(() => {
    setShowTwists(false);
    setTwistIndex(0);
  }, [promptId]);

  // Start the deck over when filters change so we don't end up on an out-of-range prompt
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    targetRef.current = 0;
    targetSV.value = 0;
    animatingRef.current = false;
    setDeckTarget(0);
    setCurrentPromptIndex(0);
  }, [liminalSpace, selectedAge, deckSource, reloadKey, progress, targetSV]);

  const chooseSource = (source: DeckSource) => {
    setSheet(null);
    setDeckSource(source);
  };
  const chooseSpace = (id: string | null) => {
    setLiminalSpace(id);
    setSheet(null);
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

  // Sent here from elsewhere ("Play in deck" after writing a prompt, ▶ in My Prompts):
  // set the deck up while it's out of sight, card face up with no flip animation,
  // those prompts for that age in any situation, freshly loaded, with the requested
  // prompt on top; then report ready so the caller switches to this tab.
  const pendingRequest = useRef<{
    promptId?: string;
    before: Prompt[];
    resolve?: () => void;
  } | null>(null);
  const promptsRef = useRef(prompts);
  promptsRef.current = prompts;
  const arrival = useSharedValue(1);
  const arrivalStyle = useAnimatedStyle(() => ({ opacity: arrival.value }));

  const applyDeckRequest = (request: DeckRequest): Promise<void> =>
    new Promise(resolve => {
      cancelAnimation(flip);
      flip.value = 0;
      setShowTwists(false);
      setDeckSource(request.source);
      if (findAgeGroup(request.ageGroup)) setSelectedAge(request.ageGroup);
      setLiminalSpace(null);
      setSessionStarted(true);
      pendingRequest.current = { promptId: request.promptId, before: promptsRef.current, resolve };
      setReloadKey(k => k + 1);
    });

  useEffect(() => registerDeckHandler(applyDeckRequest));

  // Once the fresh load is in, put the requested prompt on top, let it draw, then
  // report ready.
  useEffect(() => {
    const pending = pendingRequest.current;
    if (!pending || loading || prompts === pending.before) return;
    pendingRequest.current = null;
    const found = pending.promptId ? prompts.findIndex(p => p.id === pending.promptId) : -1;
    const start = Math.max(0, found);
    cancelAnimation(progress);
    progress.value = start;
    targetRef.current = start;
    targetSV.value = start;
    animatingRef.current = false;
    setDeckTarget(start);
    setCurrentPromptIndex(start);
    // Hidden as the tab switches in, then a quick fade up (only on these arrivals;
    // tapping the Prompts tab stays instant).
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        arrival.value = 0;
        pending.resolve?.();
        arrival.value = withDelay(
          ARRIVAL_DELAY_MS,
          withTiming(1, { duration: ARRIVAL_FADE_MS, easing: Easing.out(Easing.quad) }),
        );
      }),
    );
  }, [loading, prompts, progress, arrival, targetSV]);

  // Reflections: a prompt that was on top long enough to have been talked about gets
  // a "How did that go?" once it's swiped away (once per prompt per session). The
  // offer waits for the card to finish leaving.
  // The clock starts when the prompt is actually in front of someone: on each new
  // prompt, and when the session starts (the first prompt loads behind the cover card).
  const shownAt = useRef(Date.now());
  useEffect(() => {
    shownAt.current = Date.now();
  }, [promptId, sessionStarted]);
  const reflectedIds = useRef(new Set<string>());
  const pendingReflection = useRef<Prompt | null>(null);
  const [reflectFor, setReflectFor] = useState<Prompt | null>(null);
  const noteLeaving = () => {
    const p = currentPrompt;
    if (!p || reflectedIds.current.has(p.id)) return;
    if (Date.now() - shownAt.current < REFLECT_AFTER_MS) return;
    reflectedIds.current.add(p.id);
    pendingReflection.current = p;
  };

  const settle = (index: number) => {
    animatingRef.current = false;
    setCurrentPromptIndex(index);
    if (pendingReflection.current) {
      setReflectFor(pendingReflection.current);
      pendingReflection.current = null;
    }
  };

  /**
   * Moves the deck to `target`. Calls stack up: a second swipe while a card is still
   * flying retargets the same animation, so quick swipes are never dropped.
   */
  const goTo = (target: number) => {
    // Never past the end card.
    const t = Math.max(0, Math.min(target, endIndex));
    if (prompts.length === 0) return;
    if (t !== targetRef.current) {
      setShowTwists(false);
      haptic.light();
      if (t > targetRef.current) noteLeaving();
    }
    // From rest, a skip accelerates away; mid-flight, or going back, it eases in.
    const easing =
      !animatingRef.current && t > targetRef.current ? Easing.in(Easing.quad) : Easing.out(Easing.quad);
    targetRef.current = t;
    targetSV.value = t;
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
  // one. A drag can start mid-flight; it picks the deck up where it is. The movement
  // itself stays on the UI thread; the decision at release runs on JS through a ref,
  // so it always sees the latest state without rebuilding the gesture.
  // While the card is flipped, swiping it moves between twists instead; the prompt
  // deck stays put.
  const dragStart = useSharedValue(0);
  const dragging = useSharedValue(false);
  const onDeckRelease = useRef((_forward: boolean, _back: boolean) => {});
  onDeckRelease.current = (forward, back) => {
    if (showTwists) {
      if (forward || back) changeTwist(forward ? 1 : -1);
      else twistShift.value = withTiming(0, { duration: TWIST_IN_MS });
      return;
    }
    if (forward) handleSkip();
    else if (back && targetRef.current > 0) handleBack();
    else goTo(targetRef.current);
  };
  const releaseDeck = useCallback(
    (forward: boolean, back: boolean) => onDeckRelease.current(forward, back),
    [],
  );
  const deckPan = Gesture.Pan()
    .activeOffsetX([-SWIPE_ACTIVATE_PX, SWIPE_ACTIVATE_PX])
    .failOffsetY([-SWIPE_FAIL_Y_PX, SWIPE_FAIL_Y_PX])
    .onStart(() => {
      dragging.value = true;
      if (showTwistsSV.value) return;
      cancelAnimation(progress);
      dragStart.value = progress.value;
    })
    .onUpdate(e => {
      if (showTwistsSV.value) {
        twistShift.value = Math.max(-TWIST_SLIDE, Math.min(TWIST_SLIDE, e.translationX * 0.35));
        return;
      }
      let p = dragStart.value - e.translationX / windowWidth;
      // Rubber-band before the first prompt and past the end card, and never more than
      // one card ahead.
      if (p < 0) p = p / 3;
      if (p > endSV.value) p = endSV.value + (p - endSV.value) / 3;
      progress.value = Math.min(p, targetSV.value + 1);
    })
    .onEnd(e => {
      dragging.value = false;
      const forward = e.translationX < -windowWidth * SWIPE_THRESHOLD || e.velocityX < -FLICK_VELOCITY;
      const back = e.translationX > windowWidth * SWIPE_THRESHOLD || e.velocityX > FLICK_VELOCITY;
      runOnJS(releaseDeck)(forward, back);
    })
    .onFinalize((_, success) => {
      // Cancelled mid-drag (e.g. by the system): settle wherever the deck is heading.
      if (!success && dragging.value) {
        dragging.value = false;
        runOnJS(releaseDeck)(false, false);
      }
    });

  // Tapping a page-turn zone flashes that side of the screen, but only when the tap
  // actually turns the page (not "back" from the first prompt).
  const tapFlash = useTapFlash();
  const tapBack = () => {
    if (targetRef.current === 0) return;
    tapFlash.flash('left');
    handleBack();
  };
  const tapForward = () => {
    if (prompts.length === 0) return;
    tapFlash.flash('right');
    handleSkip();
  };

  const handleReport = () => setSheet('report');

  const sendReport = async (reason: ReportReason) => {
    setSheet(null);
    if (!currentPrompt) return;
    try {
      const result = await submitPromptReport(currentPrompt.id, reason);
      if (result === 'unavailable') {
        toast.show({
          message:
            'Thanks for flagging it. Reports can’t be sent from this build yet, so please mention it in TestFlight feedback.',
          icon: 'flag',
          duration: 5000,
        });
      } else {
        toast.show({
          message:
            result === 'sent'
              ? 'Thanks for flagging it. We’ll review this prompt.'
              : 'Thanks. Your report will go out when you’re back online.',
          icon: 'flag',
        });
      }
    } catch {
      toast.show({ message: 'Couldn’t send the report. Please try again.', icon: 'alert-circle' });
    }
  };

  // Before a session, the title card sits on a small deck, built from the same cards
  // as the session's deck and moved by `titleProgress` (card 0 is the title card):
  //   - With an age group set, card 1 is that age's first prompt. The title card
  //     leaves (swiped, or Start a session) to reveal it, and the session starts.
  //   - Without one, card 1 is the age options. Once the title card has gone, picking
  //     an age puts that age's first prompt on card 2, underneath; the age card then
  //     leaves too, and the session starts.
  // The prompt ends where the session's top card sits, so the handover is seamless.
  const titleProgress = useSharedValue(0);
  const [coverGone, setCoverGone] = useState(false);
  const selectedAgeRef = useRef(selectedAge);
  selectedAgeRef.current = selectedAge;
  const titleMoving = useRef(false);
  const titleMovingSV = useSharedValue(false);

  const moveTitleDeck = (to: number, then: () => void) => {
    titleMoving.current = true;
    titleMovingSV.value = true;
    titleProgress.value = withTiming(
      to,
      { duration: SWIPE_MS, easing: Easing.in(Easing.quad) },
      finished => {
        if (finished) runOnJS(then)();
      },
    );
  };
  const afterCoverLeft = () => {
    titleMoving.current = false;
    titleMovingSV.value = false;
    if (selectedAgeRef.current) setSessionStarted(true);
    else setCoverGone(true);
  };
  const sendCoverAway = () => {
    if (titleMoving.current || coverGone) return;
    haptic.light();
    moveTitleDeck(1, afterCoverLeft);
  };
  const sendAgeCardAway = () => {
    if (titleMoving.current) return;
    haptic.light();
    moveTitleDeck(2, () => {
      titleMoving.current = false;
      titleMovingSV.value = false;
      setSessionStarted(true);
    });
  };

  // Picking an age before a session: wait until its first prompt has loaded onto the
  // card underneath, then send the top card (title or age options) away to reveal it.
  const [revealWhenReady, setRevealWhenReady] = useState(false);
  const handleSelectAge = (id: AgeGroupId) => {
    setSelectedAge(id);
    setAgeMenuOpen(false);
    if (sessionStarted) return;
    selectedAgeRef.current = id;
    setRevealWhenReady(true);
  };

  // From the end card: back to this deck's first prompt (a hard reset with a quick fade,
  // rather than every card flying back in), or another age group's deck.
  const restartDeck = () => {
    cancelAnimation(progress);
    setShowTwists(false);
    arrival.value = 0;
    progress.value = 0;
    targetRef.current = 0;
    targetSV.value = 0;
    animatingRef.current = false;
    setDeckTarget(0);
    setCurrentPromptIndex(0);
    haptic.light();
    arrival.value = withDelay(
      ARRIVAL_DELAY_MS,
      withTiming(1, { duration: ARRIVAL_FADE_MS, easing: Easing.out(Easing.quad) }),
    );
  };
  const chooseDeckAge = (id: AgeGroupId) => {
    setSheet(null);
    if (id === selectedAge) restartDeck();
    else handleSelectAge(id);
  };

  // Start a session works like swiping the title card away: it reveals the first
  // prompt, or the age options when no age group is set yet.
  const handleStartSession = () => sendCoverAway();

  // The first prompt for the chosen age, once it has loaded (the list briefly still
  // holds the previous age's prompts right after a pick).
  const firstPrompt =
    selectedAge && !loading && prompts[0]?.ageGroup === selectedAge ? prompts[0] : undefined;
  // Ready once the new age's prompts are in (or there turn out to be none).
  const firstPromptReady =
    !!selectedAge && !loading && (prompts.length === 0 || prompts[0]?.ageGroup === selectedAge);
  useEffect(() => {
    if (!revealWhenReady || !firstPromptReady) return;
    setRevealWhenReady(false);
    if (coverGone) sendAgeCardAway();
    else sendCoverAway();
    // Runs when the prompt becomes ready; the send functions read current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealWhenReady, firstPromptReady]);

  const titleCardContent = (index: number) => {
    const promptCard = firstPrompt && (
      <PromptCardContent
        prompt={firstPrompt}
        category={categories.find(c => c.id === firstPrompt.categoryId)}
        accent={accent}
        showListen={ttsEnabled}
      />
    );
    if (index === 0) {
      return (
        <View style={styles.titleCard}>
          <Image
            source={isDark ? TITLE_ART.dark : TITLE_ART.light}
            style={styles.titleArt}
            accessibilityRole="image"
            accessibilityLabel="What If?"
          />
          <Text style={[styles.titleSubtitle, { color: colors.textSecondary }]}>
            {currentAgeGroup
              ? `Start a session to get your first prompt for ages ${currentAgeGroup.label.replace(' years', '').replace('-', ' – ')}.`
              : "Start a session and choose who you're talking with to get your first prompt."}
          </Text>
        </View>
      );
    }
    // The age options stay on card 1 once they've been shown, until that card leaves.
    const ageCardShown = coverGone || !selectedAge;
    if (index === 1) return ageCardShown ? <AgePickCard onSelect={handleSelectAge} /> : promptCard;
    if (index === 2 && coverGone) return promptCard;
    return null;
  };

  // Swiping moves the title card; the age options are chosen by tapping.
  const coverGoneSV = useSharedValue(false);
  useEffect(() => {
    coverGoneSV.value = coverGone;
  }, [coverGone, coverGoneSV]);
  const titleDragging = useSharedValue(false);
  const onTitleRelease = useRef((_forward: boolean) => {});
  onTitleRelease.current = forward => {
    if (coverGone || titleMoving.current) return;
    if (forward) sendCoverAway();
    else titleProgress.value = withTiming(0, { duration: SWIPE_MS, easing: Easing.out(Easing.quad) });
  };
  const releaseTitle = useCallback((forward: boolean) => onTitleRelease.current(forward), []);
  const titlePan = Gesture.Pan()
    .activeOffsetX([-SWIPE_ACTIVATE_PX, SWIPE_ACTIVATE_PX])
    .failOffsetY([-SWIPE_FAIL_Y_PX, SWIPE_FAIL_Y_PX])
    .onStart(() => {
      titleDragging.value = true;
    })
    .onUpdate(e => {
      if (coverGoneSV.value || titleMovingSV.value) return;
      const p = -e.translationX / windowWidth;
      // A rightward tug just rubber-bands.
      titleProgress.value = p < 0 ? p / 3 : Math.min(1, p);
    })
    .onEnd(e => {
      titleDragging.value = false;
      const forward = e.translationX < -windowWidth * SWIPE_THRESHOLD || e.velocityX < -FLICK_VELOCITY;
      runOnJS(releaseTitle)(forward);
    })
    .onFinalize((_, success) => {
      if (!success && titleDragging.value) {
        titleDragging.value = false;
        runOnJS(releaseTitle)(false);
      }
    });

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
  // Nothing is mounted past the end card, so the stack thins out as the deck runs down.
  const deckFirst = Math.max(0, Math.min(currentPromptIndex, deckTarget) - 1);
  const deckLast = Math.min(Math.max(currentPromptIndex, deckTarget) + SPAWN_DEPTH, endIndex);
  const deckIndexes: number[] = [];
  for (let i = deckLast; i >= deckFirst; i--) deckIndexes.push(i);

  const renderBody = () => {
    if (!sessionStarted) {
      // Title card shown until an age group is picked.
      return (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GestureDetector gesture={titlePan}>
            <View style={styles.deck}>
              {TITLE_DECK_INDEXES.map(index => (
                <DeckCard
                key={index}
                index={index}
                progress={titleProgress}
                width={windowWidth}
                shadow={shadowBase}
                interactive={index === 1 && coverGone}
                style={[styles.stackCard, stackCardStyle]}
              >
                {titleCardContent(index)}
              </DeckCard>
            ))}
            </View>
          </GestureDetector>
        </ScrollView>
      );
    }

    if (loading || prompts.length === 0) {
      return (
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator size="large" color={PINK} />
          ) : deckSource === 'user' ? (
            <>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {liminalSpace
                  ? "None of your prompts fit this age group and situation yet."
                  : "You haven't made any prompts for this age group yet."}
              </Text>
              <View style={styles.emptyActions}>
                <Button label="Write a prompt" icon="edit-3" onPress={openPromptEditor} />
                <Button
                  label="Show What If Originals"
                  variant="secondary"
                  onPress={() => chooseSource('official')}
                />
              </View>
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No prompts match these filters. Try a different age group or situation.
            </Text>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page-turn zones, like an ebook: tapping the empty space left of center goes
            back, right of center goes forward. They sit behind the card, so taps on
            the card and its buttons never reach them. Hidden from VoiceOver, which
            has the Previous prompt button's actions instead. */}
        <View
          style={styles.tapZones}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Pressable style={styles.tapZone} onPress={tapBack} />
          <Pressable style={styles.tapZone} onPress={tapForward} />
        </View>

        <GestureDetector gesture={deckPan}>
          <View style={styles.deck}>
            {/* The deck, deepest card first so the top card draws last. Cards are keyed
                by their place in the deck, so each keeps its prompt from the moment it
                fades in at the bottom until it has flown off and is removed. */}
            {deckIndexes.map(index => {
              const prompt = promptAt(index);
              const isCurrent = index === currentPromptIndex;
              if (!prompt) {
                // The end card, one past the last prompt.
                return (
                  <DeckCard
                    key={index}
                    index={index}
                    progress={progress}
                    width={windowWidth}
                    shadow={shadowBase}
                    interactive={isCurrent}
                    style={[styles.stackCard, stackCardStyle]}
                  >
                    <EndOfDeckCard
                      count={prompts.length}
                      ageLabel={currentAgeGroup?.label.replace(' years', '').replace('-', ' – ') ?? null}
                      spaceName={currentSpace?.name ?? null}
                      accent={accent}
                      onChooseDeck={() => setSheet('deck')}
                      onStartOver={restartDeck}
                    />
                  </DeckCard>
                );
              }
              return (
                <DeckCard
                  key={index}
                  index={index}
                  progress={progress}
                  width={windowWidth}
                  shadow={shadowBase}
                  interactive={isCurrent}
                  flip={isCurrent ? flip : undefined}
                  style={[styles.stackCard, stackCardStyle]}
                >
                  {isCurrent ? (
                    <>
                      <Animated.View
                        style={[styles.cardFace, frontFaceStyle]}
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
                          onDiscussion={openDiscussion}
                          showListen={ttsEnabled}
                          speaking={speaking}
                          onListen={toggleListen}
                          onSourcePress={() => setSheet('source')}
                        />
                      </Animated.View>
                      {twist && (
                        <Animated.View
                          style={[styles.cardFace, backFaceStyle]}
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
                            onFlipBack={toggleTwists}
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
                style={styles.cardEdgeZones}
                pointerEvents="box-none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Pressable style={styles.cardEdgeZone} onPress={tapBack} />
                <Pressable style={styles.cardEdgeZone} onPress={tapForward} />
              </View>
            )}
          </View>
        </GestureDetector>
      </ScrollView>
    );
  };

  return (
    // Fades in when arriving from elsewhere ("Play in deck"); see applyDeckRequest.
    <Animated.View style={[styles.arrival, arrivalStyle]}>
      <Screen>
        {/* Drawn first, so the tap feedback sits behind the cards and controls. */}
        <TapFlash side="left" value={tapFlash.left} />
        <TapFlash side="right" value={tapFlash.right} />

        <ScreenHeader title="What If?" />

        <View style={styles.filterArea}>
          <View style={styles.filterRow}>
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

          {ageMenuOpen && <AgeMenu selectedAge={selectedAge} onSelect={handleSelectAge} />}
        </View>

        {renderBody()}

        {/* Once the title card is gone the age options take over, but the button's space
            is kept so the deck doesn't shift. */}
        {!sessionStarted && (
          <View
            style={[styles.startRow, { paddingBottom: Spacing.md + tabInset }, coverGone && styles.hidden]}
            pointerEvents={coverGone ? 'none' : 'auto'}
            accessibilityElementsHidden={coverGone}
            importantForAccessibility={coverGone ? 'no-hide-descendants' : 'auto'}
          >
            <Button label="Start a session" icon="play" onPress={handleStartSession} />
          </View>
        )}

        {sessionStarted && !loading && prompts.length > 0 && (
          // The buttons fade in one after another when the session starts (and stay put
          // while the deck reloads for new filters). Padded clear of the floating tab bar.
          // On the end card only the back button remains, so the deck doesn't shift.
          <View style={[styles.actionRow, { paddingBottom: Spacing.md + tabInset }]}>
            {/* Back to the previous prompt (swiping the card left skips forward). VoiceOver
                users can't swipe the card, so both directions are also actions here. */}
            <Animated.View
              entering={actionEntering(0)}
              layout={LinearTransition.duration(ACTION_FADE_MS / 2)}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={[
                  styles.circleButton,
                  { borderColor: surface.border, backgroundColor: surface.card },
                  !canGoBack && styles.disabled,
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
                <Feather name="corner-up-left" size={22} color={colors.iconDefault} />
              </TouchableOpacity>
            </Animated.View>

            {/* Only for prompts that have twists; the other buttons slide together when
                it goes. */}
            {currentPrompt && showTwistButton && (
              <Animated.View
                entering={actionEntering(1)}
                exiting={FadeOut.duration(ACTION_FADE_MS / 2)}
                layout={LinearTransition.duration(ACTION_FADE_MS / 2)}
              >
                <TouchableOpacity
                  onPress={toggleTwists}
                  style={[
                    styles.circleButton,
                    styles.twistButton,
                    {
                      borderColor: accent,
                      backgroundColor: showTwists ? accent : surface.card,
                    },
                  ]}
                  accessibilityLabel={showTwists ? 'Show the prompt' : 'Flip to twists'}
                >
                  <Feather name="shuffle" size={20} color={showTwists ? '#fff' : accent} />
                  <Text style={[styles.twistLabel, { color: showTwists ? '#fff' : accent }]}>
                    Twist
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {currentPrompt && (
              <Animated.View
                entering={actionEntering(2)}
                exiting={FadeOut.duration(ACTION_FADE_MS / 2)}
                layout={LinearTransition.duration(ACTION_FADE_MS / 2)}
              >
                <TouchableOpacity
                  onPress={() => {
                    haptic.selection();
                    toggleFavorite(promptId);
                  }}
                  style={[
                    styles.circleButton,
                    { borderColor: PINK, backgroundColor: favorited ? PINK : surface.card },
                  ]}
                  accessibilityLabel={favorited ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <Feather name="heart" size={22} color={favorited ? '#fff' : PINK} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}

        {sessionStarted && currentPrompt && !loading && (
          <>
            {hasTwists && !showTwists && twistHint.ready ? (
              <HintBubble
                icon="shuffle"
                text="Tap Twist to turn the card over: a new angle on the same question."
                onDismiss={twistHint.dismiss}
                bottom={HINT_BOTTOM + tabInset}
              />
            ) : tipCount > 0 && tipsHint.ready ? (
              <HintBubble
                icon="info"
                text="Tips has ideas for getting the conversation going."
                onDismiss={tipsHint.dismiss}
                bottom={HINT_BOTTOM + tabInset}
              />
            ) : null}
          </>
        )}

        <PromptSheets
          sheet={sheet}
          onClose={() => setSheet(null)}
          deckSource={deckSource}
          onChooseSource={chooseSource}
          spaces={spaces}
          liminalSpace={liminalSpace}
          onChooseSpace={chooseSpace}
          selectedAge={selectedAge}
          onChooseAge={chooseDeckAge}
          promptId={promptId}
          onReport={sendReport}
        />
        <ReflectionSheet
          prompt={reflectFor}
          contextId={activeContext.id}
          onClose={() => setReflectFor(null)}
        />

        {ageMenuOpen && <AgeMenuBackdrop onPress={() => setAgeMenuOpen(false)} />}
      </Screen>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  filterArea: {
    // Above the backdrop and the card so the age picker can drop down over them
    zIndex: 10,
    elevation: 10,
  },
  hidden: {
    opacity: 0,
  },
  titleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArt: {
    width: TITLE_ART_WIDTH,
    height: TITLE_ART_HEIGHT,
    // Lift it a little, so it sits centered in the space above the subtitle.
    marginBottom: Spacing.xl,
  },
  // Sits at the foot of the card, leaving the mark and title centered. Footnote size
  // (12–13 pt): iOS's Footnote style and above Material's 12 sp Body Small.
  titleSubtitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
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
  arrival: {
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
  // A card in the deck. Clipping is on an inner layer (cardStyles.stackCardClip),
  // because clipping the card itself would also cut off its shadow.
  stackCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // One side of the top card. Both sides fill the card; the flip shows one at a time.
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
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
  },
});
