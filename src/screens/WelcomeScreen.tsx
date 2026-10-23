import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../providers/ThemeProvider';
import { useSurface } from '../ui/surface';
import { Button } from '../ui/components';
import { useTabBarInset } from '../navigation/tabBarInset';
import { Typography, Spacing } from '../utils/deviceHelpers';

// The first onboarding screen picks up where the launch screen leaves off: the same
// "What If?" question-mark graphic, at the same size and place (see LoadingScreen and
// ios/WhatIf/SplashScreen.storyboard), on the same plain background. The
// button then fades in slowly. The images are built by
// tools/graphics/make_splash.py.
const SPLASH = {
  light: require('../../assets/graphics/splash-light.png'),
  dark: require('../../assets/graphics/splash-dark.png'),
};
const SPLASH_WIDTH = 280;
// The images' own aspect ratio, so this stays right if they're regenerated.
const splashAsset = Image.resolveAssetSource(SPLASH.light)!;
const SPLASH_HEIGHT = (SPLASH_WIDTH * splashAsset.height!) / splashAsset.width!;

// The launch screen has already held the eye; the button should be usable almost at
// once, so the whole fade is under half a second.
const ACTIONS_DELAY_MS = 150;
const ACTIONS_FADE_MS = 250;

const fadeIn = (value: Animated.Value, delay: number, duration: number) =>
  Animated.timing(value, {
    toValue: 1,
    delay,
    duration,
    easing: Easing.inOut(Easing.quad),
    useNativeDriver: true,
  });

/**
 * First launch and the You tab's Welcome guide both open here; Get Started leads into
 * the tips deck (WelcomeTutorialScreen).
 */
export const WelcomeScreen = ({ onContinue }: { onContinue: () => void }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  // Replayed from the You tab, the button must clear the floating tab bar (0 on first launch).
  const tabInset = useTabBarInset();

  // Swiping left continues, like Get Started.
  const { width } = useWindowDimensions();
  const goNext = useRef(() => {});
  goNext.current = onContinue;
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -width * 0.2 || g.vx < -0.5) goNext.current();
      },
    }),
  ).current;

  const actions = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeIn(actions, ACTIONS_DELAY_MS, ACTIONS_FADE_MS).start();
  }, [actions]);

  const textColor = colors.textSecondary;

  return (
    <View style={[styles.fill, { backgroundColor: surface.screen }]} {...swipe.panHandlers}>
      {/* Centered on the whole screen, exactly like the launch screen. */}
      <View style={styles.center} pointerEvents="none">
        <Image
          source={isDark ? SPLASH.dark : SPLASH.light}
          style={{ width: SPLASH_WIDTH, height: SPLASH_HEIGHT }}
          accessibilityRole="image"
          accessibilityLabel="What If?"
        />
      </View>

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* Only when replayed from Settings; on first launch Welcome is the root. */}
        {navigation.canGoBack() ? (
          <Animated.View style={{ opacity: actions }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityLabel="Back"
              style={styles.back}
            >
              <Feather name="chevron-left" size={26} color={surface.accent} />
            </TouchableOpacity>
          </Animated.View>
        ) : null}
        <View style={styles.fill} pointerEvents="none" />
        <Animated.View style={[styles.actions, { paddingBottom: Spacing.lg + tabInset, opacity: actions }]}>
          <Button label="Get Started" onPress={() => goNext.current()} />
          <Text style={[styles.footer, { color: textColor }]}>
            For Parents, Educators & Therapists
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  footer: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
