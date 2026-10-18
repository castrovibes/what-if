/**
 * Haptic feedback, in four strengths the app uses consistently:
 *   light     a card committing to a swipe, a page-turn tap
 *   medium    the card flipping over to its twists (and back)
 *   selection a toggle or a step: favorite, next twist, picking an option
 *   success   something saved
 * Every call is fire-and-forget and swallows errors, so a device without a haptic
 * engine (or the simulator) behaves the same as one with it.
 */
import * as Haptics from 'expo-haptics';

const run = (p: Promise<void>) => {
  p.catch(() => {});
};

export const haptic = {
  light: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => run(Haptics.selectionAsync()),
  success: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
