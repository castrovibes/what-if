import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { ModuleRepo, Module } from '../db/repositories/modules';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

export const ModulesScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const { colors } = useTheme();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    ModuleRepo.list().then(setModules);
  }, []);

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRow}>
          <Feather name="chevron-left" size={20} color="#e10086" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>CONVERSATION SERIES</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Curated multi-prompt journeys with a theme.
        </Text>

        {modules.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[localStyles.card, { backgroundColor: m.coverColor ?? colors.cardBg }]}
            onPress={() => navigation.navigate('ModuleDetail', { moduleId: m.id })}
            activeOpacity={0.9}
          >
            <Text style={localStyles.cardTitle}>{m.title.toUpperCase()}</Text>
            <Text style={localStyles.cardDescription}>{m.description}</Text>
            <View style={localStyles.cardFooter}>
              <Feather name="calendar" size={14} color="#49297e" />
              <Text style={localStyles.cardMeta}>
                {m.durationDays} prompts • Ages {m.ageGroup}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: Typography.title2,
    fontFamily: 'Barrio-Regular',
    color: '#49297e',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    color: '#49297e',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMeta: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#49297e',
    letterSpacing: 0.8,
  },
});
