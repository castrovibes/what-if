import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useTipsForPrompt } from '../hooks/useTipsForPrompt';
import { TipKind } from '../db/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

const GROUP_ORDER: TipKind[] = ['kickstarter', 'discussion', 'follow_up', 'safety_note'];

const GROUP_META: Record<TipKind, { label: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  kickstarter: { label: 'Kickstarters',       icon: 'zap',           color: '#00db96' },
  discussion:  { label: 'Discussion',         icon: 'message-circle', color: '#90dcff' },
  follow_up:   { label: 'Follow-up',          icon: 'corner-down-right', color: '#e10086' },
  safety_note: { label: "If you're concerned", icon: 'shield',        color: '#49297e' },
};

/** A prompt's discussion tips, grouped by kind. Renders nothing while loading or when empty. */
export const DiscussionTips = ({ promptId }: { promptId: string }) => {
  const { tips, total, loading } = useTipsForPrompt(promptId);
  const { colors } = useTheme();

  if (loading || total === 0) return null;

  return (
    <View style={localStyles.container}>
      {GROUP_ORDER.map(kind => {
        const items = tips[kind];
        if (items.length === 0) return null;
        const meta = GROUP_META[kind];
        return (
          <View key={kind} style={localStyles.group}>
            <Text style={[localStyles.groupHeader, { color: colors.textSecondary }]}>
              {meta.label.toUpperCase()}
            </Text>
            <View style={localStyles.list}>
              {items.map(tip => (
                <View key={tip.id} style={localStyles.row}>
                  <Feather name={meta.icon} size={14} color={meta.color} />
                  <Text style={[localStyles.item, { color: colors.textSecondary }]}>{tip.body}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  group: {
    gap: Spacing.sm,
  },
  groupHeader: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  item: {
    flex: 1,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
  },
});
