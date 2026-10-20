import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../providers/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { Screen, ScreenHeader, ScreenScroll, Card } from '../ui/components';
import { useSurface } from '../ui/surface';
import { comingSoon } from '../ui/comingSoon';
import { CreateStackParamList } from '../navigation/types';
import { UserPromptRepo } from '../db/repositories/userPrompts';

type IconName = keyof typeof Feather.glyphMap;

/** One of the creation tools, as a tappable card. */
const ToolCard = ({
  icon,
  title,
  description,
  onPress,
  soon = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  soon?: boolean;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { borderColor: surface.border }]}>
          <Feather name={icon} size={20} color={surface.accent} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {soon && (
              <View style={[styles.soonPill, { borderColor: surface.border }]}>
                <Text style={[styles.soonText, { color: colors.textSecondary }]}>COMING SOON</Text>
              </View>
            )}
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.iconInactive} />
      </View>
    </Card>
  );
};

/**
 * Create: tools for making your own conversation starters. Prompts made here live in
 * My Prompts, and the Prompts deck can switch to them (TESTFLIGHT_CHECKLIST.md, 2c
 * item 4).
 */
export const CreateScreen = () => {
  const navigation = useNavigation<NavigationProp<CreateStackParamList>>();
  const [myCount, setMyCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      UserPromptRepo.count().then(setMyCount);
    }, []),
  );
  return (
    <Screen>
      <ScreenHeader title="Create" subtitle="Make your own conversation starters" />
      <ScreenScroll>
        <ToolCard
          icon="folder"
          title="My Prompts"
          description={
            myCount === 0
              ? "Prompts you make show up here."
              : `${myCount} prompt${myCount === 1 ? '' : 's'} you've made.`
          }
          onPress={() => navigation.navigate('MyPrompts')}
        />
        <ToolCard
          icon="edit-3"
          title="Write a prompt"
          description={'Start from a blank "What if…?" of your own.'}
          onPress={() => navigation.navigate('PromptEditor')}
        />
        <ToolCard
          icon="type"
          title="Prompt Builder"
          description="Fill in the blanks of a ready-made template."
          onPress={() => navigation.navigate('PromptBuilder')}
        />
        <ToolCard
          icon="book-open"
          title="Notes"
          description="Jot down how a conversation went."
          onPress={() => comingSoon('Notes')}
          soon
        />
      </ScreenScroll>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.body,
    fontFamily: 'Geomini-SemiBold',
  },
  description: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  soonPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  soonText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.8,
  },
});
