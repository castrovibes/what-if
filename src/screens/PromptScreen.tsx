import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
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
import { DiscussionTips } from '../components/DiscussionTips';
import { WorldBuildingCarousel } from '../components/WorldBuildingCarousel';
import { ReflectionRepo } from '../db/repositories/reflections';
import { Category, Prompt, PromptSource } from '../db/types';
import { applyTokens } from '../data/personalizationTokens';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK, CARD_RADIUS } from '../ui/surface';
import { Screen, ScreenHeader, Pill, Dot, Button, BottomSheet, SheetOption } from '../ui/components';

const DRAWER_MS = 400;
const CARD_MARGIN_BOTTOM = 24;
const CARD_CORNER_RADIUS = CARD_RADIUS;
const DRAWER_TUCK = CARD_MARGIN_BOTTOM + CARD_CORNER_RADIUS;
const DRAWER_DARKEN = 0.5625;

const SWIPE_MS = 320;

// Resting offsets of the cards stacked behind the current prompt. During a skip
// swipe the top card flies off and each card below slides up into the slot above.
const UNDER_CARD = { translateY: 6, rotate: -1.5 };
const BOTTOM_CARD = { translateY: 12, rotate: 2 };

const SOURCE_LABEL: Record<PromptSource, string> = {
  official: 'What If Originals',
  community: 'Community',
  user: 'My Prompts',
};

const darken = (hex: string, factor: number): string => {
  const h = hex.replace('#', '');
  const channel = (i: number) =>
    Math.round(parseInt(h.slice(i, i + 2), 16) * factor)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(2)}${channel(4)}`;
};

const drawerEntering = (values: { targetHeight: number }) => {
  'worklet';
  return {
    initialValues: { height: DRAWER_TUCK },
    animations: { height: withTiming(values.targetHeight, { duration: DRAWER_MS }) },
  };
};

const drawerExiting = (values: { currentHeight: number }) => {
  'worklet';
  return {
    initialValues: { height: values.currentHeight },
    animations: { height: withTiming(DRAWER_TUCK, { duration: DRAWER_MS }) },
  };
};

const slideFromBehindCard = (values: { targetHeight: number }) => {
  'worklet';
  return {
    initialValues: {
      transform: [{ translateY: -(values.targetHeight + CARD_CORNER_RADIUS) }],
    },
    animations: {
      transform: [{ translateY: withTiming(0, { duration: DRAWER_MS }) }],
    },
  };
};

const slideBackBehindCard = (values: { currentHeight: number }) => {
  'worklet';
  return {
    initialValues: { transform: [{ translateY: 0 }] },
    animations: {
      transform: [
        {
          translateY: withTiming(-(values.currentHeight + CARD_CORNER_RADIUS), {
            duration: DRAWER_MS,
          }),
        },
      ],
    },
  };
};

const restingTransform = (offset: { translateY: number; rotate: number }) => ({
  transform: [{ translateY: offset.translateY }, { rotate: `${offset.rotate}deg` }],
});

type Sheet = 'situation' | 'discussion' | 'more' | null;

export const PromptScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const route = useRoute<RouteProp<PromptsStackParamList, 'PromptsMain'>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { width: windowWidth } = useWindowDimensions();
  const accent = surface.accent;

  // No age group until the user starts a session (each app launch starts fresh), unless
  // one was passed in when navigating here.
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(
    (route.params?.ageGroup as AgeGroupId | undefined) ?? null,
  );
  const sessionStarted = selectedAge !== null;
  const [ageMenuOpen, setAgeMenuOpen] = useState(false);
  const [liminalSpace, setLiminalSpace] = useState<string | null>(
    route.params?.liminalSpace ?? null,
  );
  // Grows without bound (wrapped with % below) so every skip is a state change,
  // even when the deck has a single prompt.
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showTwists, setShowTwists] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  const { prompts, loading } = usePromptsForAge(selectedAge ?? '3-5', {
    liminalSpace: liminalSpace ?? undefined,
  });
  const { isFavorited, toggle: toggleFavorite } = useFavorites();
  const spaces = useLiminalSpaces();
  const categories = useCategories();

  const currentAgeGroup = findAgeGroup(selectedAge);
  const currentSpace = spaces.find(s => s.id === liminalSpace);

  const safeIndex = prompts.length > 0 ? currentPromptIndex % prompts.length : 0;
  const currentPrompt = prompts[safeIndex];
  const nextPrompt = prompts.length > 0 ? prompts[(safeIndex + 1) % prompts.length] : undefined;
  const promptId = currentPrompt?.id ?? '';
  const { cards: twistCards } = useWorldBuilding(promptId);
  const hasTwists = twistCards.length > 0;
  const { total: tipCount } = useTipsForPrompt(promptId);

  // 0 = card at rest, 1 = swiped off screen
  const swipe = useSharedValue(0);
  const swipingRef = useRef(false);

  useEffect(() => {
    setShowTwists(false);
  }, [promptId]);

  // Reset prompt index when filters change so we don't end up on an out-of-range prompt
  useEffect(() => {
    setCurrentPromptIndex(0);
  }, [liminalSpace, selectedAge]);

  // Once the next prompt has rendered into the top card, snap it back into place
  // before paint so the swap is invisible.
  useLayoutEffect(() => {
    swipe.value = 0;
    swipingRef.current = false;
  }, [currentPromptIndex, swipe]);

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -swipe.value * windowWidth * 1.2 },
      { rotate: `${-swipe.value * 14}deg` },
    ],
  }));

  const underCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(swipe.value, [0, 1], [UNDER_CARD.translateY, 0]) },
      { rotate: `${interpolate(swipe.value, [0, 1], [UNDER_CARD.rotate, 0])}deg` },
    ],
  }));

  const bottomCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          swipe.value,
          [0, 1],
          [BOTTOM_CARD.translateY, UNDER_CARD.translateY],
        ),
      },
      {
        rotate: `${interpolate(swipe.value, [0, 1], [BOTTOM_CARD.rotate, UNDER_CARD.rotate])}deg`,
      },
    ],
  }));

  const category = categories.find(c => c.id === currentPrompt?.categoryId);
  const nextCategory = categories.find(c => c.id === nextPrompt?.categoryId);
  const favorited = isFavorited(promptId);

  const advancePrompt = () => setCurrentPromptIndex(i => i + 1);

  const handleSkip = () => {
    if (swipingRef.current || prompts.length === 0) return;
    swipingRef.current = true;
    setShowTwists(false);
    swipe.value = withTiming(
      1,
      { duration: SWIPE_MS, easing: Easing.in(Easing.quad) },
      finished => {
        if (finished) runOnJS(advancePrompt)();
      },
    );
  };

  // TODO: send reports somewhere once there's a backend. For now this only confirms.
  const handleReport = () => {
    Alert.alert(
      'Report this prompt?',
      'Let us know if something about this prompt seems wrong or inappropriate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => Alert.alert('Thanks', "We'll take a look at this prompt."),
        },
      ],
    );
  };

  const handleSelectAge = (id: AgeGroupId) => {
    setSelectedAge(id);
    setAgeMenuOpen(false);
  };

  const stackCardStyle = {
    backgroundColor: surface.underCard,
    borderColor: surface.border,
    ...surface.shadow,
  };

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
            <View style={[localStyles.stackCard, stackCardStyle, restingTransform(BOTTOM_CARD)]} />
            <View style={[localStyles.stackCard, stackCardStyle, restingTransform(UNDER_CARD)]} />
            <View
              style={[
                localStyles.card,
                localStyles.titleCard,
                { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
              ]}
            >
              <Text style={[localStyles.titleMark, { color: accent }]}>?</Text>
              <Text style={[localStyles.titleText, { color: accent }]}>What Could You Do?</Text>
              <Text style={[localStyles.titleSubtitle, { color: colors.textSecondary }]}>
                Start a session and choose who you're talking with to get your first prompt.
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
        <View style={localStyles.deck}>
          {/* The rest of the deck, peeking out behind the current prompt. The card
              directly underneath shows the next prompt so a skip reveals it. */}
          {!showTwists && (
            <>
              <Animated.View style={[localStyles.stackCard, stackCardStyle, bottomCardStyle]} />
              <Animated.View
                style={[localStyles.stackCard, stackCardStyle, underCardStyle]}
                pointerEvents="none"
              >
                {nextPrompt && (
                  <PromptCardContent prompt={nextPrompt} category={nextCategory} accent={accent} />
                )}
              </Animated.View>
            </>
          )}

          <Animated.View
            style={[
              localStyles.card,
              { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
              topCardStyle,
            ]}
          >
            <PromptCardContent
              prompt={currentPrompt}
              category={category}
              accent={accent}
              tipCount={tipCount}
              onReport={handleReport}
              onDiscussion={() => setSheet('discussion')}
            />
          </Animated.View>
        </View>

        {hasTwists && showTwists && (
          <Animated.View
            entering={drawerEntering}
            exiting={drawerExiting}
            style={localStyles.drawerClip}
          >
            <Animated.View entering={slideFromBehindCard} exiting={slideBackBehindCard}>
              <WorldBuildingCarousel
                cards={twistCards}
                resetKey={promptId}
                accent={currentAgeGroup?.bgColor}
                bgColor={
                  currentAgeGroup ? darken(currentAgeGroup.bgColor, DRAWER_DARKEN) : undefined
                }
                peekFromTop={CARD_CORNER_RADIUS}
              />
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="What If"
        rightIcon="menu"
        rightLabel="More"
        onRightPress={() => setSheet('more')}
      />

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
          <Button label="Start a session" icon="play" onPress={() => setAgeMenuOpen(true)} />
        </View>
      )}

      {sessionStarted && currentPrompt && !loading && (
        <View style={localStyles.actionRow}>
          <TouchableOpacity
            onPress={handleSkip}
            style={[localStyles.circleButton, { borderColor: surface.border, backgroundColor: surface.card }]}
            accessibilityLabel="Skip to next prompt"
          >
            <Feather name="x" size={22} color={colors.iconDefault} />
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
            accessibilityLabel={showTwists ? 'Hide twists' : 'Add a twist'}
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

      <BottomSheet visible={sheet === 'more'} title="More ways to talk" onClose={() => setSheet(null)}>
        <SheetOption
          label="Series"
          selected={false}
          leading={<Feather name="book-open" size={16} color={colors.iconDefault} />}
          onPress={() => {
            setSheet(null);
            navigation.navigate('Modules');
          }}
        />
        <SheetOption
          label="Mad Libs"
          selected={false}
          leading={<Feather name="edit-3" size={16} color={colors.iconDefault} />}
          onPress={() => {
            setSheet(null);
            navigation.navigate('MadLibs');
          }}
        />
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
const PromptCardContent = ({
  prompt,
  category,
  accent,
  tipCount,
  onReport,
  onDiscussion,
}: {
  prompt: Prompt;
  category: Category | undefined;
  accent: string;
  tipCount?: number;
  onReport?: () => void;
  onDiscussion?: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const personalization = usePersonalization();
  const noTips = tipCount === 0;

  return (
    <>
      <View style={localStyles.cardHeader}>
        <View style={localStyles.sourceRow}>
          <Ionicons name="sparkles-outline" size={14} color={accent} />
          <Text style={[localStyles.sourceText, { color: accent }]}>
            {SOURCE_LABEL[prompt.source]}
          </Text>
        </View>
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
        <Text style={[localStyles.promptText, { color: colors.textPrimary }]}>
          {applyTokens(prompt.text, personalization)}
        </Text>
        <Text style={[localStyles.fullQuestion, { color: colors.textSecondary }]}>
          {prompt.fullQuestion}
        </Text>
      </View>

      <View style={localStyles.cardFooter}>
        {/* TODO: wire up text-to-speech (needs expo-speech + a native rebuild) */}
        <TouchableOpacity style={localStyles.footerButton} accessibilityLabel="Listen">
          <Feather name="volume-2" size={16} color={colors.textPrimary} />
          <Text style={[localStyles.footerText, { color: colors.textPrimary }]}>Listen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[localStyles.footerButton, noTips && localStyles.disabled]}
          onPress={onDiscussion}
          disabled={noTips}
          accessibilityLabel="Discussion tips"
        >
          <Feather name="message-circle" size={16} color={colors.textPrimary} />
          <Text style={[localStyles.footerText, { color: colors.textPrimary }]}>Discussion</Text>
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
  },
  deck: {
    marginBottom: CARD_MARGIN_BOTTOM,
    zIndex: 2,
  },
  stackCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  card: {
    minHeight: 340,
    borderRadius: CARD_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
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
    paddingVertical: Spacing.lg,
  },
  promptText: {
    fontSize: Typography.title1,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    lineHeight: Math.round(Typography.title1 * 1.25),
  },
  fullQuestion: {
    marginTop: Spacing.md,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
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
  drawerClip: {
    overflow: 'hidden',
    marginTop: -DRAWER_TUCK,
    paddingTop: CARD_CORNER_RADIUS,
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
