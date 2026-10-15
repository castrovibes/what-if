import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { styles as sharedStyles } from '../styles/sharedStyles';
import { useTipsForPrompt } from '../hooks/useTipsForPrompt';
import { TipKind } from '../db/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GROUP_ORDER: TipKind[] = ['kickstarter', 'discussion', 'follow_up', 'safety_note'];

const GROUP_META: Record<TipKind, { label: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  kickstarter: { label: 'Kickstarters',       icon: 'zap',           color: '#00db96' },
  discussion:  { label: 'Discussion',         icon: 'message-circle', color: '#90dcff' },
  follow_up:   { label: 'Follow-up',          icon: 'corner-down-right', color: '#e10086' },
  safety_note: { label: "If you're concerned", icon: 'shield',        color: '#49297e' },
};

export const ExpandableTipsPanel = ({
  promptId,
  headerless = false,
}: {
  promptId: string;
  /** Render just the tip groups, always expanded, for hosts that supply their own title. */
  headerless?: boolean;
}) => {
  const { tips, total, loading } = useTipsForPrompt(promptId);
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  if (loading || total === 0) return null;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  const groups = GROUP_ORDER.map(kind => {
    const items = tips[kind];
    if (items.length === 0) return null;
    const meta = GROUP_META[kind];
    return (
      <View key={kind} style={localStyles.group}>
        <Text style={[localStyles.groupHeader, { color: colors.textSecondary }]}>
          {meta.label.toUpperCase()}
        </Text>
        <View style={sharedStyles.tipsBoxList}>
          {items.map(tip => (
            <View key={tip.id} style={sharedStyles.tipsBoxRow}>
              <Feather name={meta.icon} size={14} color={meta.color} />
              <Text style={[sharedStyles.tipsBoxItem, { color: colors.textSecondary, flex: 1 }]}>
                {tip.body}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  });

  if (headerless) {
    return <View style={localStyles.headerlessContent}>{groups}</View>;
  }

  return (
    <View style={[sharedStyles.tipsBox, { backgroundColor: colors.tipsBoxBg, borderColor: colors.tipsBoxBorder }]}>
      <TouchableOpacity style={localStyles.headerRow} onPress={handleToggle} activeOpacity={0.7}>
        <Text style={[sharedStyles.tipsBoxTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
          Discussion Tips
        </Text>
        <View style={localStyles.headerRight}>
          <Text style={[localStyles.countText, { color: colors.textSecondary }]}>
            {total}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.iconDefault}
          />
        </View>
      </TouchableOpacity>

      {expanded && <View style={localStyles.expandedContent}>{groups}</View>}
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  headerlessContent: {
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  group: {
    gap: Spacing.sm,
  },
  groupHeader: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});
