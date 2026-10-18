/**
 * Geometry of the floating tab bar (FloatingTabBar.tsx), shared with everything that
 * has to stay clear of it: scrolling content, the deck's action row, toasts and hints.
 *
 * The bar floats over the screen rather than taking a band off the bottom, so screens
 * get the full height and must pad their own bottom edge by `useTabBarInset()`. That
 * hook reads the height the bar reports to the navigator, and is 0 outside the tabs
 * (onboarding, the sign-up modal), so the same screen code works in both places.
 */
import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Spacing } from '../utils/deviceHelpers';

/** The pill's height. */
export const TAB_BAR_HEIGHT = 64;
/** Gap between the pill and the screen's sides. */
export const TAB_BAR_SIDE_MARGIN = Spacing.lg;

/** Distance from the bottom of the screen to the pill's bottom edge. */
export const tabBarBottomOffset = (insetBottom: number) => Math.max(insetBottom, Spacing.md);

/** How much of the screen's bottom the bar covers, plus a little breathing room above it. */
export const tabBarOverlayHeight = (insetBottom: number) =>
  tabBarBottomOffset(insetBottom) + TAB_BAR_HEIGHT + Spacing.sm;

/** Extra bottom padding a screen needs so nothing ends up under the bar; 0 outside the tabs. */
export const useTabBarInset = () => useContext(BottomTabBarHeightContext) ?? 0;
