import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WelcomeTutorialScreen } from '../screens/WelcomeTutorialScreen';
import { useStackScreenOptions } from './transitions';

const Stack = createStackNavigator<OnboardingStackParamList>();

/**
 * First launch: Welcome, then the Welcome guide (the swipeable tips deck), then the
 * app, where the deck opens on the age pick and the first prompt. The same guide can
 * be replayed from the You tab.
 */
export const OnboardingNavigator = ({ onComplete }: { onComplete: () => void }) => {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Welcome">
        {({ navigation }) => <WelcomeScreen onContinue={() => navigation.navigate('WelcomeTutorial')} />}
      </Stack.Screen>
      <Stack.Screen name="WelcomeTutorial">
        {() => <WelcomeTutorialScreen onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
