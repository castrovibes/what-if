import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { ReflectionRepo, Reflection } from '../db/repositories/reflections';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { PromptsStackParamList } from '../navigation/types';
import { Typography, Spacing } from '../utils/deviceHelpers';

export const ProfileScreen = () => {
  const { colors, isDark } = useTheme();
  const { activeContext } = useActiveContext();
  // ProfileScreen is its own stack but we deep-link into PromptsStack screens, which works because the navigator is shared in MainTab
  const navigation = useNavigation<NavigationProp<PromptsStackParamList>>();
  const [contentFilter, setContentFilter] = useState('vetted');
  const [reflections, setReflections] = useState<Reflection[]>([]);

  useEffect(() => {
    ReflectionRepo.listForContext(activeContext.id, 5).then(setReflections);
  }, [activeContext.id]);

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Your conversation journey
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileInfo}>
            <View style={[styles.profileAvatar, { backgroundColor: '#49297e' }]}>
              <Feather name="user" size={32} color="#fff" />
            </View>
            <View>
              <Text style={styles.profileName}>WELCOME BACK!</Text>
              <Text style={styles.profileRole}>Parent & Educator</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: '#90dcff' }]}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Prompts Explored</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#00db96' }]}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#e10086' }]}>
              <Text style={[styles.statValue, { color: '#fff' }]}>4</Text>
              <Text style={[styles.statLabel, { color: '#fff' }]}>Age Groups Used</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#fdfb76' }]}>
              <Text style={[styles.statValue, { color: '#49297e' }]}>2</Text>
              <Text style={[styles.statLabel, { color: '#49297e' }]}>Prompts Submitted</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.contentFilterCard,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <View style={styles.contentFilterHeader}>
            <Feather name="shield" size={20} color="#49297e" />
            <Text style={[styles.contentFilterTitle, { color: colors.textPrimary }]}>QUALITY & SAFETY</Text>
          </View>
          <Text style={[styles.contentFilterDescription, { color: colors.textSecondary }]}>
            Control what user-created content appears in your feed
          </Text>

          <TouchableOpacity style={styles.radioOption} onPress={() => setContentFilter('all')}>
            <View style={styles.radioButton}>
              {contentFilter === 'all' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                Display All User Created Content
              </Text>
              <Text style={[styles.radioDescription, { color: colors.textSecondary }]}>
                Show all community prompts without filtering
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.radioDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.radioOption} onPress={() => setContentFilter('vetted')}>
            <View style={styles.radioButton}>
              {contentFilter === 'vetted' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.radioContent}>
              <View style={styles.radioLabelRow}>
                <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                  Display User Created Content After Vetting
                </Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
              </View>
              <Text style={[styles.radioDescription, { color: colors.textSecondary }]}>
                Only show prompts reviewed by our moderation team
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.radioDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.radioOption} onPress={() => setContentFilter('friends')}>
            <View style={styles.radioButton}>
              {contentFilter === 'friends' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                Display Only User Created Content from Friends
              </Text>
              <Text style={[styles.radioDescription, { color: colors.textSecondary }]}>
                Most restrictive - only see prompts from your connections
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.statsCard, { backgroundColor: colors.cardBg, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
          onPress={() => (navigation as any).navigate('Personalization')}
        >
          <Feather name="edit-2" size={20} color="#e10086" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary, marginBottom: 2 }]}>Personalize prompts</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter-Medium', fontSize: Typography.subheadline }}>
              Name, location, interests — for {activeContext.label}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.iconInactive} />
        </TouchableOpacity>

        {reflections.length > 0 && (
          <View style={[styles.statsCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Recent Reflections</Text>
            {reflections.map(r => (
              <View
                key={r.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter-Medium', fontSize: Typography.caption, marginBottom: 4 }}>
                  {new Date(r.createdAt).toLocaleDateString()} {r.rating ? `• Rating ${r.rating}/5` : ''}
                </Text>
                {r.note && (
                  <Text style={{ color: colors.textPrimary, fontFamily: 'Inter-Medium', fontSize: Typography.subheadline, lineHeight: 20 }}>
                    {r.note}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <LinearGradient colors={['#49297e', '#3a1d66']} style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>UPGRADE TO PROFESSIONAL</Text>
          <Text style={styles.upgradeDescription}>
            Access case management, analytics, and specialized prompt libraries
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Learn More</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};
