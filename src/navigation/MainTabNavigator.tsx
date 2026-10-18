import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import {
  CreateStackParamList,
  ExploreStackParamList,
  MainTabParamList,
  RootStackParamList,
  YouStackParamList,
} from './types';
import { PromptsStackNavigator } from './PromptsStackNavigator';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ModuleDetailScreen } from '../screens/ModuleDetailScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { MadLibsScreen } from '../screens/MadLibsScreen';
import { PromptEditorScreen } from '../screens/PromptEditorScreen';
import { MyPromptsScreen } from '../screens/MyPromptsScreen';
import { YouScreen } from '../screens/you/YouScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';
import { FAQScreen } from '../screens/FAQScreen';
import { ImConcernedScreen } from '../screens/ImConcernedScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WelcomeTutorialScreen } from '../screens/WelcomeTutorialScreen';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface, PINK } from '../ui/surface';
import { useAuth } from '../auth/AuthProvider';
import { FeatureFlags } from '../data/featureFlags';
import { useStackScreenOptions, useTransitions } from './transitions';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Height of the tab bar's content (icons + labels), above the home indicator /
// gesture area. The safe-area inset is added per device, so this is right on an
// iPhone SE, a Dynamic Island iPhone and Android gesture navigation alike.
const TAB_BAR_CONTENT_HEIGHT = 54;
// Minimum padding under the icons on devices with no bottom inset.
const TAB_BAR_MIN_BOTTOM_PADDING = 10;
// Longest the sign-up offer waits for the slide-in from onboarding to report its end.
const SIGNUP_OFFER_FALLBACK_MS = 900;

const TAB_ICON: Record<keyof MainTabParamList, keyof typeof Feather.glyphMap> = {
  Prompts: 'message-circle',
  Explore: 'compass',
  Create: 'plus-circle',
  You: 'user',
};

const ExploreStack = createStackNavigator<ExploreStackParamList>();
const CreateStack = createStackNavigator<CreateStackParamList>();
const YouStack = createStackNavigator<YouStackParamList>();

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

/**
 * The You tab: account, preferences and help, plus the screens that hang off them.
 * The Welcome Guide replays the welcome screen (fading in) and the tips deck; finishing
 * it returns to the Prompts tab.
 */
const YouStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  const { fade } = useTransitions();
  return (
    <YouStack.Navigator screenOptions={screenOptions}>
      <YouStack.Screen name="YouMain" component={YouScreen} />
      <YouStack.Screen name="Personalization" component={PersonalizationScreen} />
      <YouStack.Screen name="FAQ" component={FAQScreen} />
      <YouStack.Screen name="ImConcerned" component={ImConcernedScreen} />
      <YouStack.Screen name="Welcome" options={fade}>
        {({ navigation }) => (
          <WelcomeScreen onContinue={() => navigation.navigate('WelcomeTutorial')} />
        )}
      </YouStack.Screen>
      <YouStack.Screen name="WelcomeTutorial">
        {({ navigation }) => (
          <WelcomeTutorialScreen
            onComplete={() => {
              navigation.popToTop();
              navigation.getParent()?.navigate('Prompts');
            }}
          />
        )}
      </YouStack.Screen>
    </YouStack.Navigator>
  );
};

export const MainTabNavigator = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { account, signupOfferPending, setSignupOfferPending } = useAuth();
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);

  // Right after first-launch onboarding, offer sign-up once (it can be closed). Wait for
  // the app's slide-in to finish: a screen pushed mid-transition takes over the card's
  // animation, and the hand-off from onboarding would jump. The timer covers a transition
  // that never reports its end.
  useEffect(() => {
    if (!signupOfferPending) return;
    setSignupOfferPending(false);
    if (account || !FeatureFlags.showSignup) return;
    let offered = false;
    const offer = () => {
      if (offered) return;
      offered = true;
      navigation.navigate('Signup');
    };
    const unsubscribe = navigation.addListener('transitionEnd', offer);
    const timer = setTimeout(offer, SIGNUP_OFFER_FALLBACK_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [signupOfferPending, setSignupOfferPending, navigation, account]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Feather name={TAB_ICON[route.name]} size={size} color={color} />,
        tabBarActiveTintColor: PINK,
        tabBarInactiveTintColor: colors.iconInactive,
        // The same tokens as the screens, so the bar never shows a different black.
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: surface.border,
          backgroundColor: surface.screen,
          paddingBottom: bottomPadding,
          height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
        },
      })}
    >
      <Tab.Screen name="Prompts" component={PromptsStackNavigator} />
      <Tab.Screen name="Explore" component={ExploreStackNavigator} />
      <Tab.Screen name="Create" component={CreateStackNavigator} />
      <Tab.Screen name="You" component={YouStackNavigator} />
    </Tab.Navigator>
  );
};
