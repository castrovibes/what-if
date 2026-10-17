import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { CreateStackParamList, ExploreStackParamList, MainTabParamList , RootStackParamList } from './types';
import { PromptsStackNavigator } from './PromptsStackNavigator';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ModuleDetailScreen } from '../screens/ModuleDetailScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { MadLibsScreen } from '../screens/MadLibsScreen';
import { PromptEditorScreen } from '../screens/PromptEditorScreen';
import { MyPromptsScreen } from '../screens/MyPromptsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { FeatureFlags } from '../data/featureFlags';
import { useStackScreenOptions } from './transitions';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Height of the tab bar's content (icons + labels), above the home indicator /
// gesture area. The safe-area inset is added per device, so this is right on an
// iPhone SE, a Dynamic Island iPhone and Android gesture navigation alike.
const TAB_BAR_CONTENT_HEIGHT = 54;
// Minimum padding under the icons on devices with no bottom inset.
const TAB_BAR_MIN_BOTTOM_PADDING = 10;

const ExploreStack = createStackNavigator<ExploreStackParamList>();
const CreateStack = createStackNavigator<CreateStackParamList>();
const ProfileStack = createStackNavigator();

const ExploreStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  return (
    <ExploreStack.Navigator screenOptions={screenOptions}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="ModuleDetail" component={ModuleDetailScreen} />
    </ExploreStack.Navigator>
  );
};

const CreateStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  return (
    <CreateStack.Navigator screenOptions={screenOptions}>
      <CreateStack.Screen name="CreateMain" component={CreateScreen} />
      <CreateStack.Screen name="MadLibs" component={MadLibsScreen} />
      <CreateStack.Screen name="PromptEditor" component={PromptEditorScreen} />
      <CreateStack.Screen name="MyPrompts" component={MyPromptsScreen} />
    </CreateStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Personalization" component={PersonalizationScreen} />
    </ProfileStack.Navigator>
  );
};

export const MainTabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { account, signupOfferPending, setSignupOfferPending } = useAuth();
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);

  // Right after first-launch onboarding, offer sign-up once (it can be closed).
  useEffect(() => {
    if (!signupOfferPending) return;
    setSignupOfferPending(false);
    if (!account && FeatureFlags.showSignup) navigation.navigate('Signup');
  }, [signupOfferPending, setSignupOfferPending, navigation, account]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'message-circle';

          if (route.name === 'Prompts') iconName = 'message-circle';
          else if (route.name === 'Explore') iconName = 'compass';
          else if (route.name === 'Create') iconName = 'plus-circle';
          else if (route.name === 'Profile') iconName = 'user';

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e10086',
        tabBarInactiveTintColor: colors.iconInactive,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.tabBarBorder,
          backgroundColor: colors.tabBarBg,
          paddingBottom: bottomPadding,
          height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
        },
      })}
    >
      <Tab.Screen name="Prompts" component={PromptsStackNavigator} />
      <Tab.Screen name="Explore" component={ExploreStackNavigator} />
      <Tab.Screen name="Create" component={CreateStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
