import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
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
import { Carousel } from '../ui/Carousel';
import { useSurface, PINK, Surface } from '../ui/surface';
import { ThemeColors } from '../theme/themes';
import { comingSoon } from '../ui/comingSoon';
import { ModuleRepo, Module } from '../db/repositories/modules';
import { ExploreStackParamList } from '../navigation/types';
import { SeriesCard } from '../components/SeriesCard';
import { ARTICLE_STUBS, ArticleStub } from '../data/articles';

/**
 * Explore: things to discover beyond the prompt deck. Each section is a horizontal
 * carousel: conversation Series, a preview of the Community, and Articles & Guides
 * (placeholder stubs for now). Opening a section as its own full screen is a
 * nice-to-have (TESTFLIGHT_CHECKLIST.md).
 */

// Sample community posts; the community isn't built yet.
type SamplePost = {
  id: string;
  name: string;
  role: string;
  when: string;
  ages: string;
  ageColor: string;
  avatarColor: string;
  avatarIcon: string;
  text: string;
  likes: number;
  liked: boolean;
  comments: number;
};

const SAMPLE_POSTS: SamplePost[] = [
  {
    id: 'post-1',
    name: 'Sarah M.',
    role: 'Parent',
    when: '2 days ago',
    ages: 'Ages 6-8',
    ageColor: '#00db96',
    avatarColor: '#90dcff',
    avatarIcon: '#49297e',
    text: 'What if you found a lost wallet with money in it?',
    likes: 24,
    liked: false,
    comments: 8,
  },
  {
    id: 'post-2',
    name: 'Michael T.',
    role: 'Educator',
    when: '5 days ago',
    ages: 'Ages 9-12',
    ageColor: '#e10086',
    avatarColor: '#e10086',
    avatarIcon: '#fff',
    text: 'What if you noticed a classmate was always alone at lunch?',
    likes: 42,
    liked: true,
    comments: 15,
  },
  {
    id: 'post-3',
    name: 'Priya K.',
    role: 'School counselor',
    when: '1 week ago',
    ages: 'Ages 13-15',
    ageColor: '#fdfb76',
    avatarColor: '#00db96',
    avatarIcon: '#49297e',
    text: 'What if your group chat started making fun of someone who isn’t in it?',
    likes: 31,
    liked: false,
    comments: 11,
  },
  {
    id: 'post-4',
    name: 'Dan R.',
    role: 'Parent',
    when: '2 weeks ago',
    ages: 'Ages 3-5',
    ageColor: '#90dcff',
    avatarColor: '#fdfb76',
    avatarIcon: '#49297e',
    text: 'What if your teddy bear could talk for one day?',
    likes: 18,
    liked: false,
    comments: 4,
  },
];

type CommunityItem = { kind: 'share' } | { kind: 'post'; post: SamplePost };
const COMMUNITY_ITEMS: CommunityItem[] = [
  { kind: 'share' },
  ...SAMPLE_POSTS.map(post => ({ kind: 'post' as const, post })),
];

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
        articleKind: { ...local.articleKind, color: surface.accent },
        articleIcon: { ...local.articleIcon, borderColor: surface.border },
        articleTitle: { ...local.articleTitle, color: colors.textPrimary },
        articleBlurb: { ...local.articleBlurb, color: colors.textSecondary },
        articleMeta: { ...local.articleMeta, color: colors.textSecondary },
      }),
    [colors, surface],
  );

type ThemedStyles = ReturnType<typeof useThemedStyles>;

/** A small "Preview · coming soon" chip for sections that aren't built yet. */
const PreviewNote = ({ t, what }: { t: ThemedStyles; what: string }) => (
  <View style={t.previewNote}>
    <Feather name="eye" size={13} color={PINK} />
    <Text style={t.previewNoteText}>
      <Text style={t.previewNoteStrong}>Preview</Text> · Coming soon; {what} are examples.
    </Text>
  </View>
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

  const renderCommunity = (item: CommunityItem) => {
    if (item.kind === 'share') {
      return (
        <Card fill>
          <View style={local.promoTitleRow}>
            <Feather name="users" size={20} color={surface.accent} />
            <Text style={t.promoTitle}>Share your ideas</Text>
          </View>
          <Text style={t.promoText}>
            Share prompts you’ve created or favorites you’ve discovered. Help other parents,
            educators, and therapists spark meaningful conversations.
          </Text>
          <View style={local.bottom}>
            <Button label="Create New Prompt" icon="plus" onPress={() => comingSoon('Sharing prompts')} />
          </View>
        </Card>
      );
    }
    const p = item.post;
    return (
      <Card fill>
        <View style={local.postHeader}>
          <View style={local.postUser}>
            <View style={[local.avatar, { backgroundColor: p.avatarColor }]}>
              <Feather name="user" size={18} color={p.avatarIcon} />
            </View>
            <View style={local.postUserText}>
              <Text style={t.postUserName} numberOfLines={1}>{p.name}</Text>
              <Text style={t.postMeta}>
                {p.role} • {p.when}
              </Text>
            </View>
          </View>
          <Pill label={p.ages} leading={<Dot color={p.ageColor} />} />
        </View>
        <Text style={t.postContent}>{p.text}</Text>
        <View style={[t.postActions, local.bottom]}>
          <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
            <Feather name="heart" size={18} color={p.liked ? PINK : colors.iconDefault} />
            <Text style={t.postActionText}>{p.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
            <Feather name="message-circle" size={18} color={colors.iconDefault} />
            <Text style={t.postActionText}>{p.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={local.postAction} onPress={() => comingSoon('Community')}>
            <Feather name="share-2" size={18} color={colors.iconDefault} />
            <Text style={t.postActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderArticle = (a: ArticleStub) => (
    <Card fill onPress={() => comingSoon('Articles')}>
      <View style={local.articleTop}>
        <View style={t.articleIcon}>
          <Feather name={a.icon} size={18} color={surface.accent} />
        </View>
        <Text style={t.articleKind}>{a.kind.toUpperCase()}</Text>
      </View>
      <Text style={t.articleTitle} numberOfLines={3}>
        {a.title}
      </Text>
      <Text style={t.articleBlurb} numberOfLines={3}>
        {a.blurb}
      </Text>
      <View style={[local.articleFooter, local.bottom]}>
        <Feather name="clock" size={14} color={colors.iconDefault} />
        <Text style={t.articleMeta}>{a.readMinutes} min read</Text>
      </View>
    </Card>
  );

  return (
    <Screen>
      <ScreenHeader title="Explore" subtitle="Series, community and more" />

      <ScreenScroll>
        {series.length > 0 && (
          <>
            <SectionLabel>Series</SectionLabel>
            <Carousel
              items={series}
              keyFor={m => m.id}
              renderItem={m => (
                <SeriesCard
                  fill
                  module={m}
                  onPress={() => navigation.navigate('ModuleDetail', { moduleId: m.id })}
                />
              )}
            />
          </>
        )}

        <SectionLabel>Community</SectionLabel>
        <PreviewNote t={t} what="posts" />
        <Carousel
          items={COMMUNITY_ITEMS}
          keyFor={item => (item.kind === 'share' ? 'share' : item.post.id)}
          renderItem={renderCommunity}
        />

        <SectionLabel>Articles & Guides</SectionLabel>
        <PreviewNote t={t} what="articles" />
        <Carousel items={ARTICLE_STUBS} keyFor={a => a.id} renderItem={renderArticle} />
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
  // Pins a card's last row to its bottom, so cards of different lengths line up.
  bottom: {
    marginTop: 'auto',
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  promoTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
  },
  promoText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
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
  postUserName: {
    fontSize: Typography.callout,
    fontFamily: 'Geomini-SemiBold',
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
  articleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  articleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleKind: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
  },
  articleTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
    lineHeight: Math.round(Typography.title3 * 1.25),
    marginBottom: Spacing.sm,
  },
  articleBlurb: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  articleMeta: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
});
