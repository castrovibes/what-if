import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { useStackScreenOptions } from './transitions';

const Stack = createStackNavigator<OnboardingStackParamList>();

/**
 * First launch is one screen: Welcome. Get Started hands over to the app, where the
 * deck opens on the age pick and the first prompt, and Twist and Tips introduce
 * themselves the first time they appear. The longer tips deck stays available as the
 * Welcome Guide on the You tab.
 */
export const OnboardingNavigator = ({ onComplete }: { onComplete: () => void }) => {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Welcome">{() => <WelcomeScreen onContinue={onComplete} />}</Stack.Screen>
    </Stack.Navigator>
  );
};
