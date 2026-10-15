import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { ModuleRepo, Module } from '../db/repositories/modules';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { findAgeGroup } from '../data/ageGroups';
import { Screen, ScreenHeader, ScreenScroll, Card, Dot } from '../ui/components';
import { useSurface } from '../ui/surface';

export const ModulesScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    ModuleRepo.list().then(setModules);
  }, []);

  return (
    <Screen>
      <ScreenHeader
        title="Conversation Series"
        subtitle="Curated multi-prompt journeys with a theme."
        onBack={() => navigation.goBack()}
      />
      <ScreenScroll>
        {modules.map(m => {
          const accent = m.coverColor ?? findAgeGroup(m.ageGroup)?.bgColor ?? surface.accent;
          const ageDot = findAgeGroup(m.ageGroup)?.bgColor ?? accent;
          return (
            <Card
              key={m.id}
              accent={accent}
              onPress={() => navigation.navigate('ModuleDetail', { moduleId: m.id })}
            >
              <View>
                <Text style={[localStyles.cardTitle, { color: colors.textPrimary }]}>{m.title}</Text>
                <Text style={[localStyles.cardDescription, { color: colors.textSecondary }]}>
                  {m.description}
                </Text>
                <View style={localStyles.cardFooter}>
                  <View style={localStyles.meta}>
                    <Feather name="calendar" size={14} color={surface.accent} />
                    <Text style={[localStyles.metaText, { color: colors.textSecondary }]}>
                      {m.durationDays} prompts
                    </Text>
                  </View>
                  <View style={localStyles.meta}>
                    <Dot color={ageDot} />
                    <Text style={[localStyles.metaText, { color: colors.textSecondary }]}>
                      Ages {m.ageGroup}
                    </Text>
                  </View>
                  <View style={localStyles.spacer} />
                  <Feather name="chevron-right" size={18} color={colors.iconInactive} />
                </View>
              </View>
            </Card>
          );
        })}
      </ScreenScroll>
    </Screen>
  );
};

const localStyles = StyleSheet.create({
  cardTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
});
