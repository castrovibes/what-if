import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList } from './types';
import { PromptsStackNavigator } from './PromptsStackNavigator';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';
import { FAQScreen } from '../screens/FAQScreen';
import { ImConcernedScreen } from '../screens/ImConcernedScreen';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator<MainTabParamList>();
const CommunityStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const SettingsStack = createStackNavigator();

const CommunityStackNavigator = () => (
  <CommunityStack.Navigator screenOptions={{ headerShown: false }}>
    <CommunityStack.Screen name="CommunityMain" component={CommunityScreen} />
  </CommunityStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="Personalization" component={PersonalizationScreen} />
  </ProfileStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
    <SettingsStack.Screen name="FAQ" component={FAQScreen} />
    <SettingsStack.Screen name="ImConcerned" component={ImConcernedScreen} />
    <SettingsStack.Screen name="Personalization" component={PersonalizationScreen} />
  </SettingsStack.Navigator>
);

export const MainTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'message-circle';

          if (route.name === 'Prompts') iconName = 'message-circle';
          else if (route.name === 'Community') iconName = 'users';
          else if (route.name === 'Profile') iconName = 'user';
          else if (route.name === 'Settings') iconName = 'settings';

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e10086',
        tabBarInactiveTintColor: colors.iconInactive,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.tabBarBorder,
          backgroundColor: colors.tabBarBg,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
      })}
    >
      <Tab.Screen name="Prompts" component={PromptsStackNavigator} />
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
};
