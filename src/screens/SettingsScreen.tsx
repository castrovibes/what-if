import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform, ActionSheetIOS, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { useSurface, PINK } from '../ui/surface';
import {
  Screen,
  ScreenHeader,
  ScreenScroll,
  Card,
  SectionLabel,
  ListRow,
  Button,
  Dot,
  BottomSheet,
  SheetOption,
} from '../ui/components';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { ageGroups, findAgeGroup } from '../data/ageGroups';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const { activeContext, setPreferredAgeGroup } = useActiveContext();
  const preferredAge = findAgeGroup(activeContext.ageGroupDefault);
  const [ageSheetOpen, setAgeSheetOpen] = useState(false);
  const { isDark, colors, toggleDarkMode } = useTheme();
  const surface = useSurface();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const showLogOutActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Log Out'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Are you sure you want to log out?',
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            Alert.alert('Logged Out', 'You have been logged out successfully.');
          }
        }
      );
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => {} },
      ]);
    }
  };

  const showDeleteAccountActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Account'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Delete Account?',
          message: 'This action cannot be undone. All your data will be permanently deleted.',
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            Alert.alert('Confirm Deletion', 'Type DELETE to confirm account deletion', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {} },
            ]);
          }
        }
      );
    } else {
      Alert.alert(
        'Delete Account',
        'This action cannot be undone. All your data will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Account', style: 'destructive', onPress: () => {} },
        ]
      );
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Settings" subtitle="Customize your experience" />

      <ScreenScroll>
        <SectionLabel>Account</SectionLabel>
        <Card padded={false}>
          <ListRow icon="user" label="Edit Profile" onPress={() => {}} />
          <ListRow icon="mail" label="Email Preferences" onPress={() => {}} />
          <ListRow icon="lock" label="Privacy & Security" onPress={() => {}} last />
        </Card>

        <SectionLabel>Preferences</SectionLabel>
        <Card padded={false}>
          <ListRow
            icon="users"
            label="Preferred age range"
            detail={
              preferredAge
                ? preferredAge.label.replace('-', ' – ')
                : 'Ask each session'
            }
            onPress={() => setAgeSheetOpen(true)}
          />
          <ListRow
            icon="bell"
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.switchTrackFalse, true: PINK }}
                thumbColor="#fff"
              />
            }
          />
          <ListRow
            icon="volume-2"
            label="Text-to-Speech"
            right={
              <Switch
                value={ttsEnabled}
                onValueChange={setTtsEnabled}
                trackColor={{ false: colors.switchTrackFalse, true: PINK }}
                thumbColor="#fff"
              />
            }
          />
          <ListRow
            icon="moon"
            label="Dark Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.switchTrackFalse, true: PINK }}
                thumbColor="#fff"
              />
            }
          />
          <ListRow icon="globe" label="Language" detail="English" onPress={() => {}} last />
        </Card>

        <SectionLabel>Support & Info</SectionLabel>
        <Card padded={false}>
          <ListRow
            icon="book-open"
            label="View Welcome Guide"
            onPress={() => (navigation as any).navigate('Welcome')}
          />
          <ListRow
            icon="help-circle"
            label="Help & FAQ"
            onPress={() => (navigation as any).navigate('FAQ')}
          />
          <ListRow
            icon="life-buoy"
            iconColor={surface.accent}
            label="I'm concerned"
            onPress={() => (navigation as any).navigate('ImConcerned')}
          />
          <ListRow icon="mail" label="Contact Support" onPress={() => {}} />
          <ListRow icon="file-text" label="About" detail="Version 1.0.0" onPress={() => {}} last />
        </Card>

        <Card accent={surface.accent} style={localStyles.upgradeCard}>
          <View style={localStyles.upgradeTitleRow}>
            <Feather name="award" size={20} color={surface.accent} />
            <Text style={[localStyles.upgradeTitle, { color: surface.accent }]}>Go Professional</Text>
          </View>
          <Text style={[localStyles.upgradeDescription, { color: colors.textSecondary }]}>
            Unlock advanced features for educators and therapists
          </Text>
          <Button label="Upgrade Now" onPress={() => {}} />
        </Card>

        <Card padded={false}>
          <ListRow icon="log-out" label="Log Out" onPress={showLogOutActionSheet} />
          <ListRow
            icon="trash-2"
            label="Delete Account"
            onPress={showDeleteAccountActionSheet}
            destructive
            last
          />
        </Card>

        <Card padded={false} style={localStyles.devCard}>
          <ListRow
            icon="refresh-cw"
            iconColor={DEV_AMBER}
            label="Replay First Launch (Dev)"
            detail="Shows the welcome flow on next launch. Theme & data preserved."
            chevron={false}
            onPress={async () => {
              await AsyncStorage.removeItem('hasLaunchedBefore');
              Alert.alert('Reset Complete', 'Restart the app to see the welcome screen.');
            }}
            last
          />
        </Card>
      </ScreenScroll>
      <BottomSheet
        visible={ageSheetOpen}
        title="Preferred age range"
        onClose={() => setAgeSheetOpen(false)}
      >
        <SheetOption
          label="Ask each session"
          selected={!preferredAge}
          leading={<Feather name="help-circle" size={16} color={colors.iconDefault} />}
          onPress={() => {
            setPreferredAgeGroup(null);
            setAgeSheetOpen(false);
          }}
        />
        {ageGroups.map(g => (
          <SheetOption
            key={g.id}
            label={g.label.replace('-', ' – ')}
            selected={g.id === preferredAge?.id}
            leading={<Dot color={g.bgColor} />}
            onPress={() => {
              setPreferredAgeGroup(g.id);
              setAgeSheetOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
};

/** Amber used to flag developer-only tools. */
const DEV_AMBER = '#ca8a04';

const localStyles = StyleSheet.create({
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
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
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
