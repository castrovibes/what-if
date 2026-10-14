import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { ageGroups, findAgeGroup, AgeGroupId } from '../data/ageGroups';
import { usePromptCountsByAge } from '../hooks/usePromptsForAge';
import { LiminalSpaceChips } from '../components/LiminalSpaceChips';
import { PromptsStackParamList } from '../navigation/types';

export const PromptsScreen = () => {
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const { colors } = useTheme();
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(null);
  const [currentPromptIndex] = useState(0);
  const [liminalSpace, setLiminalSpace] = useState<string | null>(null);
  const counts = usePromptCountsByAge();

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Start a meaningful conversation
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <LiminalSpaceChips selected={liminalSpace} onSelect={setLiminalSpace} />

        <View style={[styles.homeCard, { backgroundColor: colors.cardBg }]}>
          <Text style={styles.homeCardWatermark}>?</Text>
          <Text style={[styles.homeCardTitle, { color: colors.textPrimary }]}>READY TO EXPLORE?</Text>
          <Text style={[styles.homeCardDescription, { color: colors.textSecondary }]}>
            Choose an age group to begin your conversation journey
          </Text>
          <View style={styles.ageGroupGrid}>
            {ageGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.ageGroupButton,
                  {
                    backgroundColor: group.bgColor,
                    borderBottomWidth: 3,
                    borderBottomColor: group.accentColor,
                  },
                ]}
                onPress={() => {
                  setSelectedAge(group.id);
                  navigation.navigate('Prompt', { ageGroup: group.id, liminalSpace: liminalSpace ?? undefined });
                }}
              >
                <Text style={[styles.ageGroupLabel, { color: group.labelColor }]}>{group.label}</Text>
                <Text style={[styles.ageGroupCount, { color: group.countColor }]}>
                  {counts ? `${counts[group.id]} prompts` : '…'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedAge && counts && (
          <View style={[styles.continueCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.continueTitle, { color: colors.textPrimary }]}>
              Continue where you left off
            </Text>
            <View style={styles.continueDescriptionRow}>
              <View
                style={[
                  styles.continueColorDot,
                  { backgroundColor: findAgeGroup(selectedAge)?.bgColor },
                ]}
              />
              <Text style={[styles.continueDescription, { color: colors.textSecondary }]}>
                Ages {findAgeGroup(selectedAge)?.label} • Prompt {currentPromptIndex + 1} of{' '}
                {counts[selectedAge]}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Prompt', { ageGroup: selectedAge, liminalSpace: liminalSpace ?? undefined })}
            >
              <Text style={styles.primaryButtonText}>Resume</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Modules')}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#49297e',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="book-open" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Inter-SemiBold' }}>
              Series
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('MadLibs')}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#e10086',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="edit-3" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Inter-SemiBold' }}>
              Mad Libs
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.tipsBg }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>Quick Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={16} color="#00db96" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                There are no right or wrong answers
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="compass" size={16} color="#90dcff" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Focus on the thinking process
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="heart" size={16} color="#e10086" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Listen without judgment
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="message-circle" size={16} color="#49297e" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Share your thoughts too
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
