import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps, BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface, PINK } from '../ui/surface';
import { haptic } from '../ui/haptics';
import { Typography } from '../utils/deviceHelpers';
import { useReduceMotion } from './transitions';
import { TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN, tabBarBottomOffset, tabBarOverlayHeight } from './tabBarInset';

// The highlight is inset from the pill by the same amount on every side, so its corner
// radius (pill radius minus the inset) runs concentric with the pill's edge.
const PILL_PADDING = 8;
const HIGHLIGHT_HEIGHT = TAB_BAR_HEIGHT - PILL_PADDING * 2;
const ICON_SIZE = 22;
// How far above the pill the scrim starts fading in.
const SCRIM_FADE = 28;

/** `#rrggbb` with an alpha, for the scrim's transparent end (same hue, no gray fringe). */
const withAlpha = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * The tab bar as a floating pill: a raised card that hovers above the bottom of the
 * screen with the screen showing around it. The selected tab sits on a soft pink
 * highlight that slides between tabs. Screens keep the full height underneath and pad
 * their bottom edge with `useTabBarInset()` (see tabBarInset.ts).
 */
export const FloatingTabBar = ({ state, descriptors, navigation, insets }: BottomTabBarProps) => {
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  const reduceMotion = useReduceMotion();

  // Tell the navigator how much of the screen the bar covers, so screens can read it.
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  useEffect(() => {
    reportHeight?.(tabBarOverlayHeight(insets.bottom));
  }, [reportHeight, insets.bottom]);

  // The highlight follows the selected tab; items share the pill's inner width equally.
  const [itemWidth, setItemWidth] = useState(0);
  const onPillLayout = (e: LayoutChangeEvent) =>
    setItemWidth((e.nativeEvent.layout.width - PILL_PADDING * 2) / state.routes.length);
  const highlightX = useSharedValue(0);
  useEffect(() => {
    const target = state.index * itemWidth;
    highlightX.value = reduceMotion
      ? withTiming(target, { duration: 0 })
      : withSpring(target, { damping: 20, stiffness: 240, mass: 0.7 });
  }, [state.index, itemWidth, reduceMotion, highlightX]);
  const highlightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: highlightX.value }] }));
  const highlightColor = isDark ? 'rgba(225, 0, 134, 0.2)' : colors.tintPink;

  const bottom = tabBarBottomOffset(insets.bottom);
  return (
    <View pointerEvents="box-none" style={[styles.dock, { bottom }]}>
      {/* Content scrolling under the pill fades into the screen color, so the bar
          always sits on a calm ground rather than on a card edge. Touches pass through. */}
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(surface.screen, 0), withAlpha(surface.screen, 0.9), surface.screen]}
        locations={[0, 0.55, 1]}
        style={[styles.scrim, { bottom: -bottom, height: bottom + TAB_BAR_HEIGHT + SCRIM_FADE }]}
      />
      <View
        style={[
          styles.pill,
          { backgroundColor: surface.card, borderColor: surface.border },
          isDark ? styles.shadowDark : styles.shadowLight,
        ]}
        onLayout={onPillLayout}
        accessibilityRole="tablist"
      >
        {itemWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.highlight,
              { width: itemWidth, backgroundColor: highlightColor },
              highlightStyle,
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
          const color = focused ? PINK : colors.iconInactive;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (focused || event.defaultPrevented) return;
            haptic.selection();
            navigation.navigate({ name: route.name, merge: true } as never);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            >
              {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
              <Text style={[styles.label, focused && styles.labelOn, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: TAB_BAR_SIDE_MARGIN,
    right: TAB_BAR_SIDE_MARGIN,
  },
  scrim: {
    position: 'absolute',
    left: -TAB_BAR_SIDE_MARGIN,
    right: -TAB_BAR_SIDE_MARGIN,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: PILL_PADDING,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadowLight: {
    shadowColor: '#2a1a4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  shadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  highlight: {
    position: 'absolute',
    left: PILL_PADDING,
    top: PILL_PADDING,
    height: HIGHLIGHT_HEIGHT,
    borderRadius: HIGHLIGHT_HEIGHT / 2,
  },
  item: {
    flex: 1,
    height: HIGHLIGHT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: Typography.caption - 1,
    fontFamily: 'Inter-Medium',
  },
  labelOn: {
    fontFamily: 'Inter-SemiBold',
  },
});
