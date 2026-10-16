import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WelcomeTutorialScreen } from '../screens/WelcomeTutorialScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="WelcomeTutorial">{() => <WelcomeTutorialScreen onComplete={onComplete} />}</Stack.Screen>
    </Stack.Navigator>
  );
};
