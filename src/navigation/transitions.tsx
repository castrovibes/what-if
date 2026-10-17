/**
 * Screen transitions, shared by every navigator so the app moves the same way everywhere:
 *
 * - push:  drilling into a screen (Modules → Module, Settings → FAQ). Slides in from the
 *          right with the iOS spring, swipe back from the edge.
 * - modal: a flow layered over the app (Sign-up). iOS card sheet that pushes the app back;
 *          slides up from the bottom on Android. Swipe down to close.
 * - fade:  a change of scene rather than a step deeper (Welcome → Tutorial, finishing
 *          onboarding). A soft cross-fade.
 *
 * With the system's Reduce Motion setting on, push and modal become the fade, as iOS does.
 * Switching tabs is instant.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import {
  CardStyleInterpolators,
  StackNavigationOptions,
  TransitionPresets,
  TransitionSpecs,
} from '@react-navigation/stack';

/** Follows the system Reduce Motion setting, live. */
export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduceMotion;
};

const FADE_SPEC = {
  open: { animation: 'timing' as const, config: { duration: 320, easing: Easing.out(Easing.poly(4)) } },
  close: { animation: 'timing' as const, config: { duration: 220, easing: Easing.in(Easing.linear) } },
};

const fade: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
  transitionSpec: FADE_SPEC,
  gestureEnabled: false,
};

const push: StackNavigationOptions = {
  ...TransitionPresets.SlideFromRightIOS,
  gestureEnabled: true,
};

const modal: StackNavigationOptions = {
  presentation: 'modal',
  ...(Platform.OS === 'ios' ? TransitionPresets.ModalPresentationIOS : TransitionPresets.ModalSlideFromBottomIOS),
  gestureEnabled: true,
  transitionSpec: { open: TransitionSpecs.TransitionIOSSpec, close: TransitionSpecs.TransitionIOSSpec },
};

/** Stack options for each kind of transition, adjusted for Reduce Motion. */
export const useTransitions = () => {
  const reduceMotion = useReduceMotion();
  return {
    push: reduceMotion ? { ...fade, gestureEnabled: true } : push,
    modal: reduceMotion ? { ...fade, presentation: 'modal' as const } : modal,
    fade,
  };
};

/** Default options for a stack navigator: no header, push transition. */
export const useStackScreenOptions = (): StackNavigationOptions => {
  const { push: pushOptions } = useTransitions();
  return { headerShown: false, ...pushOptions };
};

/**
 * Fades its children in once, on mount (e.g. the app appearing after the loading
 * screen), over `backdrop` so the window's default white never shows through: a color,
 * or something to show underneath (the loading screen, so the app fades in from it).
 */
export const FadeIn = ({
  children,
  backdrop,
  duration = 280,
}: {
  children: React.ReactNode;
  backdrop: string | React.ReactNode;
  duration?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [opacity, duration]);
  return (
    <View style={[styles.fill, typeof backdrop === 'string' && { backgroundColor: backdrop }]}>
      {typeof backdrop !== 'string' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {backdrop}
        </View>
      )}
      <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
