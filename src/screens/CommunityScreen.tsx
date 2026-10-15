import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';

export const CommunityScreen = () => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Share and discover prompts
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <LinearGradient
          colors={['#90dcff', '#00db96']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.communityHeaderCard}
        >
          <Text style={styles.communityHeaderTitle}>SHARE YOUR IDEAS</Text>
          <Text style={styles.communityHeaderDescription}>
            Share prompts you've created or favorites you've discovered. Help other parents,
            educators, and therapists spark meaningful conversations.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Create New Prompt</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <TouchableOpacity style={styles.filterButtonActive}>
            <Text style={styles.filterButtonActiveText}>All Prompts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.filterInactiveBg }]}>
            <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>My Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.filterInactiveBg }]}>
            <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>My Submissions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.filterInactiveBg }]}>
            <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>Trending</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.communityPostCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.postHeader}>
            <View style={styles.postUserInfo}>
              <View style={[styles.avatar, { backgroundColor: '#90dcff' }]}>
                <Feather name="user" size={20} color="#49297e" />
              </View>
              <View>
                <Text style={[styles.postUserName, { color: colors.textPrimary }]}>Sarah M.</Text>
                <Text style={[styles.postMeta, { color: colors.textSecondary }]}>Parent • 2 days ago</Text>
              </View>
            </View>
            <View style={[styles.ageBadge, { backgroundColor: '#00db96' }]}>
              <Text style={styles.ageBadgeText}>Ages 6-8</Text>
            </View>
          </View>
          <Text style={[styles.postContent, { color: colors.textPrimary }]}>
            What if you found a lost wallet with money in it?
          </Text>
          <View style={[styles.postActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="heart" size={18} color={colors.iconDefault} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>24</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.communityPostCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.postHeader}>
            <View style={styles.postUserInfo}>
              <View style={[styles.avatar, { backgroundColor: '#e10086' }]}>
                <Feather name="user" size={20} color="#fff" />
              </View>
              <View>
                <Text style={[styles.postUserName, { color: colors.textPrimary }]}>Michael T.</Text>
                <Text style={[styles.postMeta, { color: colors.textSecondary }]}>Educator • 5 days ago</Text>
              </View>
            </View>
            <View style={[styles.ageBadge, { backgroundColor: '#e10086' }]}>
              <Text style={[styles.ageBadgeText, { color: '#fff' }]}>Ages 9-12</Text>
            </View>
          </View>
          <Text style={[styles.postContent, { color: colors.textPrimary }]}>
            What if you noticed a classmate was always alone at lunch?
          </Text>
          <View style={[styles.postActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="heart" size={18} color="#e10086" />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>42</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="message-circle" size={18} color={colors.iconDefault} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>15</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="share-2" size={18} color={colors.iconDefault} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
