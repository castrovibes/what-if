/**
 * Shared building blocks for the app's card-based look. See `surface.ts` for tokens.
 *
 * Typography: Geomini for headings (ExtraBold screen titles, Bold card and sheet titles,
 * SemiBold buttons), Inter for everything else, including the small uppercase section
 * labels (Inter-SemiBold, tracked).
 */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollView,
  FlatList,
  FlatListProps,
  ListRenderItem,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../providers/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK, CARD_RADIUS, INPUT_RADIUS } from './surface';
import { useTabBarInset } from '../navigation/tabBarInset';

type IconName = keyof typeof Feather.glyphMap;

/* ============ Screen scaffolding ============ */

/** Full-screen container with the surface background. */
export const Screen = ({
  children,
  edges = ['top'],
}: {
  children: ReactNode;
  edges?: Edge[];
}) => {
  const surface = useSurface();
  return (
    <SafeAreaView style={[ui.screen, { backgroundColor: surface.screen }]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

/**
 * Screen header: optional back chevron, a purple title, an optional subtitle and an
 * optional icon action on the right. (Settings live on the You tab, so there's no ⚙.)
 */
export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightLabel,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightLabel?: string;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={ui.header}>
      <View style={ui.headerRow}>
        <View style={ui.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Back">
              <Feather name="chevron-left" size={26} color={surface.accent} />
            </TouchableOpacity>
          )}
          <Text style={[ui.headerTitle, { color: surface.accent }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {rightIcon && (
          <View style={ui.headerActions}>
            <TouchableOpacity onPress={onRightPress} hitSlop={8} accessibilityLabel={rightLabel}>
              <Feather name={rightIcon} size={22} color={surface.accent} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={[ui.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
};

/**
 * Scrolling body with the standard side padding. The bottom padding also clears the
 * floating tab bar (0 outside the tabs), so the last card can scroll out from under it.
 */
export const ScreenScroll = ({
  children,
  contentStyle,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) => {
  const tabInset = useTabBarInset();
  return (
    <ScrollView
      style={ui.scroll}
      contentContainerStyle={[ui.scrollContent, { paddingBottom: Spacing.xl + tabInset }, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
};

/**
 * Scrolling list with the standard side padding. Use this instead of ScreenScroll +
 * map for anything that can grow without bound (user-created content), so only the
 * visible rows are mounted.
 */
export function ScreenList<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  contentStyle,
}: {
  data: T[] | null | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  ListHeaderComponent?: FlatListProps<T>['ListHeaderComponent'];
  ListEmptyComponent?: FlatListProps<T>['ListEmptyComponent'];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const tabInset = useTabBarInset();
  return (
    <FlatList
      style={ui.scroll}
      contentContainerStyle={[ui.scrollContent, { paddingBottom: Spacing.xl + tabInset }, contentStyle]}
      showsVerticalScrollIndicator={false}
      data={data ?? []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

/* ============ Cards and lists ============ */

/**
 * White (light) / raised gray (dark) rounded card with hairline border and shadow.
 * `accent` draws a colored stripe across the top, clipped to the rounded corners
 * (e.g. an age-group or series color). With `accent`, `style` applies to the content
 * below the stripe. `fill` stretches the card to its container's height (e.g. so the
 * cards in a carousel row line up).
 */
export const Card = ({
  children,
  style,
  onPress,
  padded = true,
  accent,
  fill = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  accent?: string;
  fill?: boolean;
}) => {
  const surface = useSurface();
  const frame = [
    ui.card,
    { backgroundColor: surface.card, borderColor: surface.border, ...surface.shadow },
    fill && ui.cardFill,
  ];

  if (accent) {
    // The shadow lives on the outer view; clipping happens on an inner one so
    // iOS doesn't clip the shadow away along with the stripe's corners.
    const inner = (
      <View style={[ui.cardClip, fill && ui.cardFill]}>
        <View style={[ui.cardStripe, { backgroundColor: accent }]} />
        <View style={[padded && ui.cardPadded, fill && ui.cardFill, style]}>{children}</View>
      </View>
    );
    return onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={frame}>
        {inner}
      </TouchableOpacity>
    ) : (
      <View style={frame}>{inner}</View>
    );
  }

  const cardStyle = [...frame, padded && ui.cardPadded, style];
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
};

/** Small uppercase label above a group of content. */
export const SectionLabel = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return <Text style={[ui.sectionLabel, { color: colors.textSecondary }]}>{children.toUpperCase()}</Text>;
};

/**
 * A row inside a list card. Put several in an unpadded `Card`; every row but the last
 * gets a divider.
 */
export const ListRow = ({
  icon,
  iconColor,
  label,
  detail,
  right,
  onPress,
  chevron = !!onPress,
  last = false,
  destructive = false,
}: {
  icon?: IconName;
  iconColor?: string;
  label: string;
  detail?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
  destructive?: boolean;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const textColor = destructive ? '#dc2626' : colors.textPrimary;
  const content = (
    <>
      {icon && <Feather name={icon} size={18} color={destructive ? textColor : iconColor ?? colors.iconDefault} />}
      <View style={ui.rowText}>
        <Text style={[ui.rowLabel, { color: textColor }]}>{label}</Text>
        {detail && <Text style={[ui.rowDetail, { color: colors.textSecondary }]}>{detail}</Text>}
      </View>
      {right}
      {chevron && <Feather name="chevron-right" size={18} color={colors.iconInactive} />}
    </>
  );
  const rowStyle = [
    ui.row,
    !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: surface.border },
  ];
  return onPress ? (
    <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
};

/* ============ Controls ============ */

/** Rounded pill, used for filters and chips. `active` fills it pink. */
export const Pill = ({
  label,
  leading,
  icon,
  onPress,
  active = false,
  dropdown = false,
}: {
  label: string;
  leading?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  active?: boolean;
  dropdown?: boolean;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const fg = active ? '#fff' : colors.textPrimary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      style={[
        ui.pill,
        {
          backgroundColor: active ? PINK : surface.card,
          borderColor: active ? PINK : surface.border,
        },
      ]}
    >
      {leading}
      {icon && <Feather name={icon} size={14} color={active ? '#fff' : colors.iconDefault} />}
      <Text style={[ui.pillText, { color: fg }]}>{label}</Text>
      {dropdown && <Feather name="chevron-down" size={14} color={active ? '#fff' : colors.iconDefault} />}
    </TouchableOpacity>
  );
};

/** Small colored dot, e.g. for an age group. */
export const Dot = ({ color, size = 10 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);

/**
 * Full-width button. `primary` is solid pink, `secondary` is an outlined card-colored
 * button in the accent purple.
 */
export const Button = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) => {
  const surface = useSurface();
  const primary = variant === 'primary';
  const fg = primary ? '#fff' : surface.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        ui.button,
        primary
          ? { backgroundColor: PINK, borderColor: PINK }
          : { backgroundColor: surface.card, borderColor: surface.accent },
        disabled && ui.disabled,
      ]}
    >
      {icon && <Feather name={icon} size={18} color={fg} />}
      <Text style={[ui.buttonText, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ============ Bottom sheet ============ */

const SHEET_OPEN_MS = 300;
const SHEET_CLOSE_MS = 220;
const SHEET_FADE_MS = 250;

export const BottomSheet = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // The dimmed backdrop fades in place while only the sheet slides up, rather than
  // the whole modal (dim layer included) sliding in together. The modal stays
  // mounted until the closing animation has finished.
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const dim = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(1)).current; // 1 = below the screen
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: SHEET_FADE_MS, useNativeDriver: true }),
        Animated.timing(offset, {
          toValue: 0,
          duration: SHEET_OPEN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(dim, { toValue: 0, duration: SHEET_CLOSE_MS, useNativeDriver: true }),
        Animated.timing(offset, {
          toValue: 1,
          duration: SHEET_CLOSE_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // Only react to visibility changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, ui.sheetBackdrop, { opacity: dim }]}>
        <Pressable style={ui.fill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <View style={ui.sheetDock} pointerEvents="box-none">
        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            ui.sheet,
            { backgroundColor: surface.card, paddingBottom: insets.bottom + Spacing.md },
            {
              transform: [
                {
                  translateY: offset.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, sheetHeight],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[ui.sheetHandle, { backgroundColor: surface.border }]} />
          <Text style={[ui.sheetTitle, { color: colors.textPrimary }]}>{title}</Text>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SheetOption = ({
  label,
  leading,
  selected = false,
  onPress,
}: {
  label: string;
  leading: ReactNode;
  selected?: boolean;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[ui.sheetOption, { borderBottomColor: surface.border }]}
    >
      {leading}
      <Text style={[ui.sheetOptionText, { color: colors.textPrimary }]}>{label}</Text>
      {selected && <Feather name="check" size={18} color={PINK} />}
    </TouchableOpacity>
  );
};

/* ============ Styles ============ */

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: Typography.title2,
    fontFamily: 'Geomini-ExtraBold',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardPadded: {
    padding: Spacing.lg,
  },
  cardFill: {
    flex: 1,
  },
  cardClip: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  // As tall as the corner radius, so the stripe runs down to where the card's sides
  // straighten out instead of ending partway around the curve.
  cardStripe: {
    height: CARD_RADIUS,
  },
  sectionLabel: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginTop: Spacing.sm,
    marginBottom: -Spacing.xs,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
  },
  rowDetail: {
    marginTop: 2,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    // Room at the sides when the button sizes to its label (in a centered empty state).
    paddingHorizontal: Spacing.lg,
    borderRadius: INPUT_RADIUS,
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: Typography.callout,
    fontFamily: 'Geomini-SemiBold',
  },
  disabled: {
    opacity: 0.35,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fill: {
    flex: 1,
  },
  // Holds the sheet against the bottom of the screen, over the backdrop.
  sheetDock: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
    marginBottom: Spacing.sm,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
});
