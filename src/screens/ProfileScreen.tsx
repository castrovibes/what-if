import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { ReflectionRepo, Reflection } from '../db/repositories/reflections';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';
import {
  Screen,
  ScreenHeader,
  ScreenScroll,
  Card,
  SectionLabel,
  ListRow,
  Dot,
  Button,
} from '../ui/components';
import { useSurface, PINK } from '../ui/surface';

const STATS = [
  { value: '24', label: 'Prompts Explored', color: '#90dcff' },
  { value: '8', label: 'Days Active', color: '#00db96' },
  { value: '4', label: 'Age Groups Used', color: '#e10086' },
  { value: '2', label: 'Prompts Submitted', color: '#fdfb76' },
];

export const ProfileScreen = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const { activeContext } = useActiveContext();
  // ProfileScreen is its own stack but we deep-link into PromptsStack screens, which works because the navigator is shared in MainTab
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const [contentFilter, setContentFilter] = useState('vetted');
  const [reflections, setReflections] = useState<Reflection[]>([]);

  useEffect(() => {
    ReflectionRepo.listForContext(activeContext.id, 5).then(setReflections);
  }, [activeContext.id]);

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Your conversation journey" />

      <ScreenScroll>
        <Card>
          <View style={local.profileRow}>
            <View style={[local.profileAvatar, { backgroundColor: surface.accent }]}>
              <Feather name="user" size={28} color="#fff" />
            </View>
            <View style={local.flex}>
              <Text style={[local.profileName, { color: colors.textPrimary }]}>Welcome back!</Text>
              <Text style={[local.profileRole, { color: colors.textSecondary }]}>Parent & Educator</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[local.editButton, { borderColor: surface.accent }]}
            activeOpacity={0.85}
          >
            <Text style={[local.editButtonText, { color: surface.accent }]}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        <SectionLabel>Your Activity</SectionLabel>
        <View style={local.statsGrid}>
          {STATS.map(s => (
            <Card key={s.label} style={local.statTile}>
              <View style={local.statTop}>
                <Text style={[local.statValue, { color: surface.accent }]}>{s.value}</Text>
                <Dot color={s.color} />
              </View>
              <Text style={[local.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card>
          <View style={local.filterHeader}>
            <Feather name="shield" size={20} color={surface.accent} />
            <Text style={[local.cardTitle, { color: colors.textPrimary }]}>Quality & safety</Text>
          </View>
          <Text style={[local.cardText, { color: colors.textSecondary }]}>
            Control what user-created content appears in your feed
          </Text>

          <RadioOption
            selected={contentFilter === 'all'}
            onPress={() => setContentFilter('all')}
            label="Display All User Created Content"
            description="Show all community prompts without filtering"
          />
          <View style={[local.divider, { backgroundColor: surface.border }]} />
          <RadioOption
            selected={contentFilter === 'vetted'}
            onPress={() => setContentFilter('vetted')}
            label="Display User Created Content After Vetting"
            description="Only show prompts reviewed by our moderation team"
            badge="Recommended"
          />
          <View style={[local.divider, { backgroundColor: surface.border }]} />
          <RadioOption
            selected={contentFilter === 'friends'}
            onPress={() => setContentFilter('friends')}
            label="Display Only User Created Content from Friends"
            description="Most restrictive - only see prompts from your connections"
          />
        </Card>

        <Card padded={false}>
          <ListRow
            icon="edit-2"
            iconColor={PINK}
            label="Personalize prompts"
            detail={`Name, location, interests — for ${activeContext.label}`}
            onPress={() => (navigation as any).navigate('Personalization')}
            last
          />
        </Card>

        {reflections.length > 0 && (
          <>
            <SectionLabel>Recent Reflections</SectionLabel>
            <Card padded={false}>
              {reflections.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    local.reflection,
                    i < reflections.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: surface.border,
                    },
                  ]}
                >
                  <Text style={[local.reflectionMeta, { color: colors.textSecondary }]}>
                    {new Date(r.createdAt).toLocaleDateString()} {r.rating ? `• Rating ${r.rating}/5` : ''}
                  </Text>
                  {r.note && (
                    <Text style={[local.reflectionNote, { color: colors.textPrimary }]}>{r.note}</Text>
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        <Card>
          <View style={local.filterHeader}>
            <Feather name="briefcase" size={20} color={surface.accent} />
            <Text style={[local.cardTitle, { color: surface.accent }]}>Upgrade to Professional</Text>
          </View>
          <Text style={[local.cardText, { color: colors.textSecondary }]}>
            Access case management, analytics, and specialized prompt libraries
          </Text>
          <Button label="Learn More" variant="secondary" />
        </Card>
      </ScreenScroll>
    </Screen>
  );
};

/** Radio option row with a pink selection ring and an optional small badge. */
const RadioOption = ({
  selected,
  onPress,
  label,
  description,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  description: string;
  badge?: string;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <TouchableOpacity style={local.radioOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[local.radioOuter, { borderColor: selected ? PINK : surface.border }]}>
        {selected && <View style={local.radioInner} />}
      </View>
      <View style={local.flex}>
        <Text style={[local.radioLabel, { color: colors.textPrimary }]}>{label}</Text>
        {badge && (
          <View style={[local.badge, { borderColor: surface.accent }]}>
            <Text style={[local.badgeText, { color: surface.accent }]}>{badge}</Text>
          </View>
        )}
        <Text style={[local.radioDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const local = StyleSheet.create({
  flex: { flex: 1 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  profileRole: {
    marginTop: 2,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
  },
  editButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  editButtonText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  statTile: {
    width: '47.5%',
    padding: Spacing.md,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 4,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  cardText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  radioOuter: {
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
  radioLabel: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    lineHeight: 21,
  },
  radioDescription: {
    marginTop: 2,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
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
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  reflection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  reflectionMeta: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  reflectionNote: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
});
