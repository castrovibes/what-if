import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Card } from '../../ui/components';
import { Typography, Spacing } from '../../utils/deviceHelpers';

const OPTIONS = [
  {
    id: 'all',
    label: 'Show all community prompts',
    description: 'Everything people share, without filtering.',
  },
  {
    id: 'vetted',
    label: 'Only prompts reviewed by our team',
    description: 'The recommended setting for most families and classrooms.',
    recommended: true,
  },
  {
    id: 'friends',
    label: 'Only prompts from people I follow',
    description: 'The most restrictive choice.',
  },
];

/**
 * The content filter for community prompts. The community isn't live during testing,
 * so the choice is shown but not yet live: the recommended option is marked and the
 * card says so inline (TESTFLIGHT_CHECKLIST.md 2c item 5).
 */
export const QualitySafetyCard = () => {
  const { colors } = useTheme();
  const surface = useSurface();
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
          Not available during testing
        </Text>
      </View>

      <View style={styles.options} accessibilityState={{ disabled: true }}>
        {OPTIONS.map((o, i) => (
          <View
            key={o.id}
            style={[
              styles.option,
              i < OPTIONS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: surface.border,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: !!o.recommended, disabled: true }}
            accessibilityLabel={o.label}
          >
            <View style={[styles.radio, { borderColor: o.recommended ? PINK : surface.border }]}>
              {o.recommended && <View style={styles.radioInner} />}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{o.label}</Text>
              {o.recommended && (
                <View style={[styles.badge, { borderColor: surface.accent }]}>
                  <Text style={[styles.badgeText, { color: surface.accent }]}>Recommended</Text>
                </View>
              )}
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {o.description}
              </Text>
            </View>
          </View>
        ))}
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
  // Not live yet: visibly quieter, and not tappable.
  options: {
    opacity: 0.55,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 4,
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
