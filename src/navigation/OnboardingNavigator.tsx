import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WelcomeTutorialScreen } from '../screens/WelcomeTutorialScreen';
import { useStackScreenOptions, useTransitions } from './transitions';
import { HideSettingsButton } from '../ui/components';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = ({ onComplete }: { onComplete: () => void }) => {
  const screenOptions = useStackScreenOptions();
  const { fade } = useTransitions();
  // No ⚙ during first-launch onboarding.
  return (
    <HideSettingsButton>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="WelcomeTutorial" options={fade}>
          {() => <WelcomeTutorialScreen onComplete={onComplete} />}
        </Stack.Screen>
      </Stack.Navigator>
    </HideSettingsButton>
  );
};
