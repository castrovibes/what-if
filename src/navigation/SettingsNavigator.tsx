import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';
import { FAQScreen } from '../screens/FAQScreen';
import { ImConcernedScreen } from '../screens/ImConcernedScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WelcomeTutorialScreen } from '../screens/WelcomeTutorialScreen';
import { HideSettingsButton } from '../ui/components';
import { useStackScreenOptions, useTransitions } from './transitions';

const SettingsStack = createStackNavigator();

/**
 * Settings and its own screens. Opened from the ⚙ in any screen's header (it sits
 * above the tabs in the root stack); the ⚙ is hidden in here.
 */
export const SettingsNavigator = () => {
  const screenOptions = useStackScreenOptions();
  const { fade } = useTransitions();
  return (
    <HideSettingsButton>
      <SettingsStack.Navigator screenOptions={screenOptions}>
        <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
        <SettingsStack.Screen name="FAQ" component={FAQScreen} />
        <SettingsStack.Screen name="ImConcerned" component={ImConcernedScreen} />
        <SettingsStack.Screen name="Personalization" component={PersonalizationScreen} />
        {/* "View Welcome Guide" replays onboarding (with its fades); finishing it closes
            Settings on the Prompts tab. */}
        <SettingsStack.Screen name="Welcome" component={WelcomeScreen} options={fade} />
        <SettingsStack.Screen name="WelcomeTutorial" options={fade}>
          {({ navigation }) => (
            <WelcomeTutorialScreen
              onComplete={() => {
                navigation.popToTop();
                navigation.getParent()?.navigate('MainApp', { screen: 'Prompts' });
              }}
            />
          )}
        </SettingsStack.Screen>
      </SettingsStack.Navigator>
    </HideSettingsButton>
  );
};
