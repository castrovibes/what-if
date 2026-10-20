import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useSurface } from '../ui/surface';
import { hideSplash } from '../app/splash';

// Same image, size and position as the native launch screen
// (ios/WhatCouldYouDo/SplashScreen.storyboard), so the hand-off from it is seamless:
// "What If?" in Rock Salt above the hand-drawn question mark. Both are built by
// tools/graphics/make_splash.py.
const SPLASH = {
  light: require('../../assets/graphics/splash-light.png'),
  dark: require('../../assets/graphics/splash-dark.png'),
};
const SPLASH_WIDTH = 280;
// The images' own aspect ratio, so this stays right if they're regenerated.
const splashAsset = Image.resolveAssetSource(SPLASH.light);
const SPLASH_HEIGHT = (SPLASH_WIDTH * splashAsset.height) / splashAsset.width;

/**
 * Shown while the app starts up (database, account, fonts). It only relies on
 * ThemeProvider.
 */
export const LoadingScreen = () => {
  const { isDark } = useTheme();
  const surface = useSurface();
  return (
    // Once this has drawn, the native launch screen (identical) can go.
    <View style={[styles.container, { backgroundColor: surface.screen }]} onLayout={hideSplash}>
      <Image
        source={isDark ? SPLASH.dark : SPLASH.light}
        style={{ width: SPLASH_WIDTH, height: SPLASH_HEIGHT }}
        accessibilityRole="image"
        accessibilityLabel="What If?"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
