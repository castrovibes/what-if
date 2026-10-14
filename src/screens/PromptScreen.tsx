import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { findAgeGroup, AgeGroupId } from '../data/ageGroups';
import { usePromptsForAge } from '../hooks/usePromptsForAge';
import { useFavorites } from '../hooks/useFavorites';
import { useWorldBuilding } from '../hooks/useWorldBuilding';
import { usePersonalization } from '../hooks/usePersonalization';
import { ExpandableTipsPanel } from '../components/ExpandableTipsPanel';
import { WorldBuildingCarousel } from '../components/WorldBuildingCarousel';
import { ReflectionRepo } from '../db/repositories/reflections';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { applyTokens } from '../data/personalizationTokens';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

const DRAWER_MS = 400;
const CARD_MARGIN_BOTTOM = 24;
const CARD_CORNER_RADIUS = 24;
const DRAWER_TUCK = CARD_MARGIN_BOTTOM + CARD_CORNER_RADIUS;
const DRAWER_DARKEN = 0.5625;

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

export const PromptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PromptsStackParamList, 'Prompt'>>();
  const { colors } = useTheme();
  const { activeContext } = useActiveContext();
  const selectedAge = (route.params?.ageGroup ?? '3-5') as AgeGroupId;
  const liminalSpace = route.params?.liminalSpace ?? null;

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showTwists, setShowTwists] = useState(false);
  const [kidsMode, setKidsMode] = useState(false);
  const [reflectionVisible, setReflectionVisible] = useState(false);

  const { prompts, loading } = usePromptsForAge(selectedAge, {
    liminalSpace: liminalSpace ?? undefined,
    parentAskable: kidsMode || undefined,
  });
  const { isFavorited, toggle: toggleFavorite } = useFavorites();
  const personalization = usePersonalization();

  const currentAgeGroup = findAgeGroup(selectedAge);
  const ageLabel = currentAgeGroup?.label;

  const safeIndex = prompts.length > 0 ? currentPromptIndex % prompts.length : 0;
  const currentPrompt = prompts[safeIndex];
  const promptId = currentPrompt?.id ?? '';
  const { cards: twistCards } = useWorldBuilding(promptId);
  const hasTwists = twistCards.length > 0;

  const badgeScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const hasPulsedRef = useRef(false);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  useEffect(() => {
    setShowTwists(false);
  }, [promptId]);

  // Reset prompt index when filters change so we don't end up on an out-of-range prompt
  useEffect(() => {
    setCurrentPromptIndex(0);
  }, [kidsMode, liminalSpace, selectedAge]);

  useEffect(() => {
    if (hasTwists && !hasPulsedRef.current) {
      hasPulsedRef.current = true;
      badgeScale.value = withDelay(
        500,
        withSequence(
          withTiming(1.04, { duration: 280 }),
          withTiming(1, { duration: 280 }),
        ),
      );
    }
  }, [hasTwists, badgeScale]);

  if (loading || prompts.length === 0 || !currentPrompt) {
    return (
      <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={[styles.promptHeader, { backgroundColor: colors.bg }]}>
          <View style={styles.promptHeaderRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.promptBackButton}>
              <Feather name="chevron-left" size={22} color="#e10086" />
            </TouchableOpacity>
            <View style={styles.promptHeaderCenter}>
              <Text style={[styles.promptCounter, { color: colors.textSecondary }]}>
                {loading ? 'Loading…' : 'No prompts match the current filters'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          {loading ? (
            <ActivityIndicator size="large" color="#e10086" />
          ) : (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
              Try a different age group or clear the situation filter.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const totalPrompts = prompts.length;
  const favorited = isFavorited(promptId);
  const displayText = applyTokens(currentPrompt.text, personalization);

  const handleToggleTwists = () => {
    badgeScale.value = withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
    iconRotation.value = withSpring(showTwists ? 0 : 45, {
      damping: 12,
      stiffness: 180,
    });
    setShowTwists(prev => !prev);
  };

  const advancePrompt = () => {
    const next = (safeIndex + 1) % totalPrompts;
    setCurrentPromptIndex(next);
  };

  const handleNextPrompt = () => {
    setReflectionVisible(true);
  };

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.promptHeader, { backgroundColor: colors.bg }]}>
        <View style={styles.promptHeaderRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.promptBackButton}>
            <Feather name="chevron-left" size={22} color="#e10086" />
          </TouchableOpacity>
          <View style={styles.promptHeaderCenter}>
            <Text
              style={[
                styles.promptAgeLabel,
                { color: currentAgeGroup?.bgColor === '#fdfb76' ? '#49297e' : currentAgeGroup?.bgColor },
              ]}
            >
              AGES {ageLabel?.toUpperCase()}
            </Text>
            <Text style={[styles.promptCounter, { color: colors.textSecondary }]}>
              Prompt {safeIndex + 1} of {totalPrompts}
              {currentPrompt.isPlaceholder ? ' • [PLACEHOLDER]' : ''}
            </Text>
          </View>
          <View style={styles.promptActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: favorited ? '#fdfb76' : colors.bgMuted }]}
              onPress={() => toggleFavorite(promptId)}
            >
              <Feather name="star" size={22} color={favorited ? '#ca8a04' : colors.iconDefault} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#49297e' }]}>
              <Feather name="volume-2" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Kids-ask-parents mode toggle */}
        <TouchableOpacity
          onPress={() => setKidsMode(p => !p)}
          style={[
            localStyles.modeToggle,
            { backgroundColor: kidsMode ? '#49297e' : colors.bgMuted },
          ]}
          activeOpacity={0.85}
        >
          <Feather
            name={kidsMode ? 'users' : 'user'}
            size={14}
            color={kidsMode ? '#fff' : colors.iconDefault}
          />
          <Text
            style={[
              localStyles.modeToggleText,
              { color: kidsMode ? '#fff' : colors.textSecondary },
            ]}
          >
            {kidsMode ? 'Kid asks adult' : 'Adult asks kid'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.promptHeaderBar, { backgroundColor: currentAgeGroup?.bgColor }]} />

      <ScrollView
        style={styles.promptScrollView}
        contentContainerStyle={styles.promptScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={[styles.promptCard, { backgroundColor: currentAgeGroup?.bgColor, zIndex: 2 }]}>
          <Text style={[styles.promptText, { color: currentAgeGroup?.textColor }]}>
            {displayText}
          </Text>

          {hasTwists && (
            <Animated.View style={[localStyles.twistBadgeContainer, badgeAnimStyle]}>
              <TouchableOpacity
                onPress={handleToggleTwists}
                activeOpacity={0.85}
                style={localStyles.twistBadge}
              >
                <Animated.View style={iconAnimStyle}>
                  <Feather name="plus-circle" size={14} color="#49297e" />
                </Animated.View>
                <Text style={localStyles.twistBadgeText}>
                  {showTwists ? 'Hide twists' : 'Add a twist'}
                </Text>
                {!showTwists && (
                  <View style={localStyles.twistCountPill}>
                    <Text style={localStyles.twistCountText}>{twistCards.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {hasTwists && showTwists && (
          <Animated.View
            entering={drawerEntering}
            exiting={drawerExiting}
            style={localStyles.drawerClip}
          >
            <Animated.View
              entering={slideFromBehindCard}
              exiting={slideBackBehindCard}
            >
              <WorldBuildingCarousel
                cards={twistCards}
                resetKey={promptId}
                accent={currentAgeGroup?.bgColor}
                bgColor={
                  currentAgeGroup
                    ? darken(currentAgeGroup.bgColor, DRAWER_DARKEN)
                    : undefined
                }
                peekFromTop={CARD_CORNER_RADIUS}
              />
            </Animated.View>
          </Animated.View>
        )}

        <ExpandableTipsPanel promptId={promptId} />
      </ScrollView>

      <View
        style={[
          styles.bottomButtonContainer,
          { backgroundColor: colors.bg, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryButton, styles.nextPromptButton]}
          activeOpacity={0.85}
          onPress={handleNextPrompt}
        >
          <Text style={styles.primaryButtonText}>Next Prompt</Text>
          <Feather name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ReflectionModal
        visible={reflectionVisible}
        promptId={promptId}
        contextId={activeContext.id}
        onClose={() => {
          setReflectionVisible(false);
          advancePrompt();
        }}
      />
    </SafeAreaView>
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
  twistBadgeContainer: {
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
  },
  drawerClip: {
    overflow: 'hidden',
    marginTop: -DRAWER_TUCK,
    paddingTop: CARD_CORNER_RADIUS,
  },
  twistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  twistBadgeText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#49297e',
  },
  twistCountPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e10086',
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twistCountText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#fff',
  },
  modeToggle: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeToggleText: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.8,
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
    fontFamily: 'Barrio-Regular',
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
