import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { Screen, ScreenHeader, ScreenScroll, Card, Pill, Dot, Button } from '../ui/components';
import { useSurface, PINK } from '../ui/surface';

export const CommunityScreen = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <Screen>
      <ScreenHeader title="Community" subtitle="Share and discover prompts" />

      <ScreenScroll>
        <Card>
          <View style={local.promoTitleRow}>
            <Feather name="users" size={20} color={surface.accent} />
            <Text style={[local.promoTitle, { color: surface.accent }]}>Share your ideas</Text>
          </View>
          <Text style={[local.promoText, { color: colors.textSecondary }]}>
            Share prompts you've created or favorites you've discovered. Help other parents,
            educators, and therapists spark meaningful conversations.
          </Text>
          <Button label="Create New Prompt" icon="plus" />
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
              <View style={[local.avatar, { backgroundColor: '#90dcff' }]}>
                <Feather name="user" size={18} color="#49297e" />
              </View>
              <View style={local.postUserText}>
                <Text style={[local.postUserName, { color: colors.textPrimary }]}>Sarah M.</Text>
                <Text style={[local.postMeta, { color: colors.textSecondary }]}>Parent • 2 days ago</Text>
              </View>
            </View>
            <Pill label="Ages 6-8" leading={<Dot color="#00db96" />} />
          </View>
          <Text style={[local.postContent, { color: colors.textPrimary }]}>
            What if you found a lost wallet with money in it?
          </Text>
          <View style={[local.postActions, { borderTopColor: surface.border }]}>
            <TouchableOpacity style={local.postAction}>
              <Feather name="heart" size={18} color={colors.iconDefault} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>24</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <View style={local.postHeader}>
            <View style={local.postUser}>
              <View style={[local.avatar, { backgroundColor: '#e10086' }]}>
                <Feather name="user" size={18} color="#fff" />
              </View>
              <View style={local.postUserText}>
                <Text style={[local.postUserName, { color: colors.textPrimary }]}>Michael T.</Text>
                <Text style={[local.postMeta, { color: colors.textSecondary }]}>Educator • 5 days ago</Text>
              </View>
            </View>
            <Pill label="Ages 9-12" leading={<Dot color="#e10086" />} />
          </View>
          <Text style={[local.postContent, { color: colors.textPrimary }]}>
            What if you noticed a classmate was always alone at lunch?
          </Text>
          <View style={[local.postActions, { borderTopColor: surface.border }]}>
            <TouchableOpacity style={local.postAction}>
              <Feather name="heart" size={18} color={PINK} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>42</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>15</Text>
            </TouchableOpacity>
            <TouchableOpacity style={local.postAction}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={[local.postActionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScreenScroll>
    </Screen>
  );
};

const local = StyleSheet.create({
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
