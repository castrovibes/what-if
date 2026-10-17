import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import {
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionLabel,
  Card,
  Pill,
  Dot,
  Button,
} from '../ui/components';
import { useSurface, PINK, Surface } from '../ui/surface';
import { ThemeColors } from '../theme/themes';
import { comingSoon } from '../ui/comingSoon';
import { ModuleRepo, Module } from '../db/repositories/modules';
import { ExploreStackParamList } from '../navigation/types';
import { SeriesCard } from '../components/SeriesCard';

/**
 * Explore: things to discover beyond the prompt deck. Today that's the conversation
 * Series and a preview of the community; written content (guides, articles) may join
 * later. The detailed layout is still to be designed (TESTFLIGHT_CHECKLIST.md, 2c).
 */
/** Theme-dependent styles, built once per theme change rather than per render. */
const useThemedStyles = (colors: ThemeColors, surface: Surface) =>
  useMemo(
    () =>
      StyleSheet.create({
        previewNote: { ...local.previewNote, borderColor: surface.border },
        previewNoteText: { ...local.previewNoteText, color: colors.textSecondary },
        previewNoteStrong: { color: colors.textPrimary },
        promoTitle: { ...local.promoTitle, color: surface.accent },
        promoText: { ...local.promoText, color: colors.textSecondary },
        postUserName: { ...local.postUserName, color: colors.textPrimary },
        postMeta: { ...local.postMeta, color: colors.textSecondary },
        postContent: { ...local.postContent, color: colors.textPrimary },
        postActions: { ...local.postActions, borderTopColor: surface.border },
        postActionText: { ...local.postActionText, color: colors.textSecondary },
      }),
    [colors, surface],
  );

export const ExploreScreen = () => {
  const navigation = useNavigation<NavigationProp<ExploreStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const t = useThemedStyles(colors, surface);
  const [series, setSeries] = useState<Module[]>([]);

  useEffect(() => {
    ModuleRepo.list().then(setSeries);
  }, []);

  return (
    <Screen>
      <ScreenHeader title="Explore" subtitle="Series, community and more" />

      <ScreenScroll>
        {series.length > 0 && <SectionLabel>Series</SectionLabel>}
        {series.map(m => (
          <SeriesCard
            key={m.id}
            module={m}
            onPress={() => navigation.navigate('ModuleDetail', { moduleId: m.id })}
          />
        ))}

        <SectionLabel>Community</SectionLabel>
        {/* The community isn't built yet; a small note makes that clear to beta testers. */}
        <View style={t.previewNote}>
          <Feather name="eye" size={13} color={PINK} />
          <Text style={t.previewNoteText}>
            <Text style={t.previewNoteStrong}>Preview</Text> · Coming soon; posts below
            are examples.
          </Text>
        </View>

        <Card>
          <View style={local.promoTitleRow}>
            <Feather name="users" size={20} color={surface.accent} />
            <Text style={t.promoTitle}>Share your ideas</Text>
          </View>
          <Text style={t.promoText}>
            Share prompts you’ve created or favorites you’ve discovered. Help other parents,
            educators, and therapists spark meaningful conversations.
          </Text>
          <Button label="Create New Prompt" icon="plus" onPress={() => comingSoon('Sharing prompts')} />
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={local.filterRow}
          style={local.filterScroll}
        >
          <Pill label="All Prompts" active />
          <Pill label="My Favorites" />
          <Pill label="My Submissions" />
          <Pill label="Trending" />
        </ScrollView>

        <Card>
          <View style={local.postHeader}>
            <View style={local.postUser}>
              <View style={[local.avatar, local.avatarSky]}>
                <Feather name="user" size={18} color="#49297e" />
              </View>
              <View style={local.postUserText}>
                <Text style={t.postUserName}>Sarah M.</Text>
                <Text style={t.postMeta}>Parent • 2 days ago</Text>
              </View>
            </View>
            <Pill label="Ages 6-8" leading={<Dot color="#00db96" />} />
          </View>
          <Text style={t.postContent}>
            What if you found a lost wallet with money in it?
          </Text>
          <View style={t.postActions}>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="heart" size={18} color={colors.iconDefault} />
              <Text style={t.postActionText}>24</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={t.postActionText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={t.postActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <View style={local.postHeader}>
            <View style={local.postUser}>
              <View style={[local.avatar, local.avatarPink]}>
                <Feather name="user" size={18} color="#fff" />
              </View>
              <View style={local.postUserText}>
                <Text style={t.postUserName}>Michael T.</Text>
                <Text style={t.postMeta}>Educator • 5 days ago</Text>
              </View>
            </View>
            <Pill label="Ages 9-12" leading={<Dot color="#e10086" />} />
          </View>
          <Text style={t.postContent}>
            What if you noticed a classmate was always alone at lunch?
          </Text>
          <View style={t.postActions}>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="heart" size={18} color={PINK} />
              <Text style={t.postActionText}>42</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={t.postActionText}>15</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={t.postActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScreenScroll>
    </Screen>
  );
};

const local = StyleSheet.create({
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewNoteText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  promoTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  promoText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  filterScroll: {
    marginHorizontal: -Spacing.lg,
    flexGrow: 0,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    flexShrink: 1,
  },
  postUserText: {
    flexShrink: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sample community posts use fixed age-group accents.
  avatarSky: { backgroundColor: '#90dcff' },
  avatarPink: { backgroundColor: '#e10086' },
  postUserName: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  postMeta: {
    marginTop: 2,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  postContent: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
});
