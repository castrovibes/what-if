import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface, PINK } from '../ui/surface';
import { Screen, ScreenHeader, ScreenScroll, Card, ListRow } from '../ui/components';
import { PreReleaseBanner } from '../components/PreReleaseBanner';
import { ResourceRepo, Resource } from '../db/repositories/faq';
import { Typography, Spacing } from '../utils/deviceHelpers';

type Signal = 'disclosure' | 'mood' | 'safety' | 'just-checking';

const SIGNALS: { id: Signal; label: string; description: string; icon: keyof typeof Feather.glyphMap }[] = [
  {
    id: 'disclosure',
    label: 'They said something worrying',
    description: 'A disclosure about safety, abuse, or harm.',
    icon: 'message-circle',
  },
  {
    id: 'mood',
    label: 'Their mood has shifted',
    description: 'Sad, withdrawn, anxious, or angry beyond normal.',
    icon: 'cloud-rain',
  },
  {
    id: 'safety',
    label: 'I\'m worried about their safety',
    description: 'Thoughts of self-harm, suicide, or danger from others.',
    icon: 'alert-octagon',
  },
  {
    id: 'just-checking',
    label: 'Just checking in',
    description: 'No specific signal — I want context on what\'s typical.',
    icon: 'help-circle',
  },
];

export const ImConcernedScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const surface = useSurface();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (signal) ResourceRepo.forSignal(signal).then(setResources);
  }, [signal]);

  return (
    <Screen>
      <ScreenHeader
        title="I'm concerned"
        subtitle="What's coming up for you right now? We'll point you to relevant resources."
        onBack={() => navigation.goBack()}
      />

      <ScreenScroll>
        <PreReleaseBanner />

        {!signal ? (
          <Card padded={false}>
            {SIGNALS.map((s, i) => (
              <ListRow
                key={s.id}
                icon={s.icon}
                iconColor={surface.accent}
                label={s.label}
                detail={s.description}
                onPress={() => setSignal(s.id)}
                last={i === SIGNALS.length - 1}
              />
            ))}
          </Card>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setSignal(null)}
              style={localStyles.changeRow}
              hitSlop={8}
            >
              <Feather name="rotate-ccw" size={14} color={PINK} />
              <Text style={localStyles.changeText}>Change what’s coming up</Text>
            </TouchableOpacity>

            {resources.length === 0 ? (
              <Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>
                No resources tagged yet — see the full resource library.
              </Text>
            ) : (
              resources.map(r => (
                <Card
                  key={r.id}
                  onPress={r.url ? () => Linking.openURL(r.url!).catch(() => {}) : undefined}
                  style={localStyles.resourceCard}
                >
                  <Text style={[localStyles.resourceKind, { color: surface.accent }]}>
                    {r.kind.toUpperCase()} • {r.region}
                  </Text>
                  <Text style={[localStyles.resourceTitle, { color: colors.textPrimary }]}>
                    {r.title}
                  </Text>
                  {r.description && (
                    <Text style={[localStyles.resourceDescription, { color: colors.textSecondary }]}>
                      {r.description}
                    </Text>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
};

const localStyles = StyleSheet.create({
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  changeText: {
    color: PINK,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
  },
  resourceCard: {
    gap: 4,
  },
  resourceKind: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  resourceTitle: {
    fontSize: Typography.body,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  resourceDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
  },
});
