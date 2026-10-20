import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Card } from '../../ui/components';
import { haptic } from '../../ui/haptics';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { CommunityFilter } from '../../backend/model';
import { DEFAULT_COMMUNITY_FILTER, useCommunityFilter } from '../../hooks/useCommunityFilter';

const OPTIONS: { id: CommunityFilter; label: string; description: string }[] = [
  {
    id: 'all',
    label: 'Show all community prompts',
    description: 'Everything people share, without filtering.',
  },
  {
    id: 'vetted',
    label: 'Only prompts reviewed by our team',
    description: 'The recommended setting for most families and classrooms.',
  },
  {
    id: 'friends',
    label: 'Only prompts from people I follow',
    description: 'The most restrictive choice.',
  },
];

/**
 * The content filter for community prompts. The choice is saved on the device and
 * synced to the account with the other preferences (TESTFLIGHT_CHECKLIST.md 2b item 5).
 * The community isn't live during testing, so the card says the filter applies once
 * it opens.
 */
export const QualitySafetyCard = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const [filter, setFilter] = useCommunityFilter();

  const choose = (id: CommunityFilter) => {
    if (id === filter) return;
    haptic.selection();
    setFilter(id);
  };

  return (
    <Card>
      <View style={styles.titleRow}>
        <Feather name="shield" size={20} color={surface.accent} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Quality & safety</Text>
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Choose what shared prompts can appear in your feed once the community opens.
      </Text>
      <View style={[styles.notice, { borderColor: surface.border }]}>
        <Feather name="clock" size={13} color={PINK} />
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
          Applies when the community opens
        </Text>
      </View>

      <View accessibilityRole="radiogroup">
        {OPTIONS.map((o, i) => {
          const selected = o.id === filter;
          return (
            <Pressable
              key={o.id}
              onPress={() => choose(o.id)}
              style={({ pressed }) => [
                styles.option,
                i < OPTIONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: surface.border,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={o.label}
              accessibilityHint={o.description}
            >
              <View style={[styles.radio, { borderColor: selected ? PINK : surface.border }]}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{o.label}</Text>
                {o.id === DEFAULT_COMMUNITY_FILTER && (
                  <View style={[styles.badge, { borderColor: surface.accent }]}>
                    <Text style={[styles.badgeText, { color: surface.accent }]}>Recommended</Text>
                  </View>
                )}
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {o.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
  },
  text: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xs,
  },
  noticeText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  pressed: {
    opacity: 0.6,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: PINK,
  },
  label: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  description: {
    marginTop: 2,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
  },
});
