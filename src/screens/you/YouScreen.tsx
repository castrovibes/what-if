import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Screen, ScreenHeader, ScreenScroll, Card, SectionLabel, ListRow, Button } from '../../ui/components';
import { comingSoon } from '../../ui/comingSoon';
import { toast } from '../../ui/toast';
import { useAuth } from '../../providers/AuthProvider';
import { useActiveContext } from '../../providers/ActiveContextProvider';
import { useFavorites } from '../../hooks/useFavorites';
import { ReflectionRepo, Reflection } from '../../db/repositories/reflections';
import { useSyncVersion } from '../../sync/events';
import { FeatureFlags } from '../../data/featureFlags';
import { RootStackParamList, YouStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { AccountCard } from './AccountCard';
import { ActivityStats } from './ActivityStats';
import { PreferencesCard } from './PreferencesCard';
import { QualitySafetyCard } from './QualitySafetyCard';
import { useAccountActions } from './useAccountActions';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
/** Amber used to flag developer-only tools. */
const DEV_AMBER = '#ca8a04';

type Nav = NavigationProp<YouStackParamList & Pick<RootStackParamList, 'Signup' | 'WelcomeGuide'>>;

/**
 * You: account, activity, preferences, community safety, reflections, help and the
 * account actions, in one place. (Profile and Settings, merged; there's no ⚙ anywhere.)
 */
export const YouScreen = () => {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { account } = useAuth();
  const { activeContext } = useActiveContext();
  const { confirmLogOut, confirmDeleteAccount } = useAccountActions();
  const savedCount = useFavorites().favorites.size;

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const syncVersion = useSyncVersion();
  useEffect(() => {
    ReflectionRepo.listForContext(activeContext.id, 5).then(setReflections);
  }, [activeContext.id, syncVersion]);

  return (
    <Screen>
      <ScreenHeader title="You" subtitle="Your account, preferences and progress" />
      <ScreenScroll>
        <AccountCard
          onSignUp={() => navigation.navigate('Signup')}
          onLogIn={() => navigation.navigate('Signup', { mode: 'login' })}
        />

        <ActivityStats />

        <Card padded={false}>
          <ListRow
            icon="heart"
            iconColor={PINK}
            label="Saved prompts"
            detail={
              savedCount === 0
                ? `Tap ♥ on a prompt to save it for ${activeContext.label}`
                : `${savedCount} saved for ${activeContext.label}`
            }
            onPress={() => navigation.navigate('SavedPrompts')}
          />
          <ListRow
            icon="edit-2"
            iconColor={PINK}
            label="Personalize prompts"
            detail={`Name, location, interests — for ${activeContext.label}`}
            onPress={() => navigation.navigate('Personalization')}
            last
          />
        </Card>

        <PreferencesCard />

        <SectionLabel>Community</SectionLabel>
        <QualitySafetyCard />

        {reflections.length > 0 && (
          <>
            <SectionLabel>Recent reflections</SectionLabel>
            <Card padded={false}>
              {reflections.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.reflection,
                    i < reflections.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: surface.border,
                    },
                  ]}
                >
                  <Text style={[styles.reflectionMeta, { color: colors.textSecondary }]}>
                    {new Date(r.createdAt).toLocaleDateString()}
                    {r.rating ? ` · ${r.rating}/5` : ''}
                  </Text>
                  {r.note && (
                    <Text style={[styles.reflectionNote, { color: colors.textPrimary }]}>{r.note}</Text>
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionLabel>Support & info</SectionLabel>
        <Card padded={false}>
          <ListRow icon="book-open" label="Welcome guide" onPress={() => navigation.navigate('WelcomeGuide')} />
          <ListRow icon="help-circle" label="Help & FAQ" onPress={() => navigation.navigate('FAQ')} />
          {/* Hidden from testers until the content has clinical review. */}
          {FeatureFlags.showImConcerned && (
            <ListRow
              icon="life-buoy"
              iconColor={surface.accent}
              label="I'm concerned"
              onPress={() => navigation.navigate('ImConcerned')}
            />
          )}
          <ListRow
            icon="mail"
            label="Contact support"
            detail="Coming soon"
            onPress={() => comingSoon('Contact support')}
          />
          <ListRow
            icon="info"
            label="About"
            detail={`Version ${APP_VERSION} (beta)`}
            onPress={() => toast.show({ message: `What If? ${APP_VERSION} (beta)`, icon: 'info' })}
            last
          />
        </Card>

        <Card accent={surface.accent}>
          {/* A View wrapper, as SeriesCard does: text directly inside an accent card's
              padded view doesn't get a bounded width and runs past the edge. */}
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeTitleRow}>
              <Feather name="award" size={20} color={surface.accent} />
              <Text style={[styles.upgradeTitle, { color: surface.accent }]}>Go Professional</Text>
            </View>
            <Text style={[styles.upgradeDescription, { color: colors.textSecondary }]}>
              Case management, analytics and specialized prompt libraries for educators and therapists.
            </Text>
            <Button label="Learn more" variant="secondary" onPress={() => comingSoon('Professional plans')} />
          </View>
        </Card>

        <SectionLabel>Account</SectionLabel>
        <Card padded={false}>
          {!account && FeatureFlags.showSignup && (
            <ListRow
              icon="log-in"
              iconColor={surface.accent}
              label="Log in"
              detail="For an account you already have"
              onPress={() => navigation.navigate('Signup', { mode: 'login' })}
            />
          )}
          <ListRow
            icon="mail"
            label="Email preferences"
            detail="Coming soon"
            onPress={() => comingSoon('Email preferences')}
          />
          <ListRow
            icon="lock"
            label="Privacy & security"
            detail="Coming soon"
            onPress={() => comingSoon('Privacy & security settings')}
            last={!account}
          />
          {account && (
            <>
              <ListRow icon="log-out" label="Log out" onPress={confirmLogOut} />
              <ListRow icon="trash-2" label="Delete account" onPress={confirmDeleteAccount} destructive last />
            </>
          )}
        </Card>

        {FeatureFlags.showDevTools && (
          <Card padded={false} style={styles.devCard}>
            <ListRow
              icon="refresh-cw"
              iconColor={DEV_AMBER}
              label="Replay first launch (dev)"
              detail="Shows the welcome screen and the first-time hints on next launch."
              chevron={false}
              // It sits just above the tab bar, so a low tap can land here: confirm first.
              onPress={() =>
                Alert.alert('Replay first launch?', 'The welcome screen and first-time hints show again on the next launch.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await AsyncStorage.multiRemove(['hasLaunchedBefore', 'hint:twist', 'hint:tips']);
                      toast.show({ message: 'Reset. Restart the app to see the welcome flow.', icon: 'refresh-cw' });
                    },
                  },
                ])
              }
              last
            />
          </Card>
        )}
      </ScreenScroll>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  upgradeCard: {
    gap: Spacing.sm,
  },
  upgradeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  upgradeTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
  },
  upgradeDescription: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.sm,
  },
  devCard: {
    marginTop: Spacing.md,
    borderStyle: 'dashed',
    borderColor: DEV_AMBER,
    borderWidth: 1,
  },
});
