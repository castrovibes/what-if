import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SignupStackParamList } from './types';
import { AuthMethodScreen } from '../screens/signup/AuthMethodScreen';
import { EmailEntryScreen } from '../screens/signup/EmailEntryScreen';
import { CheckEmailScreen } from '../screens/signup/CheckEmailScreen';
import { ProfileSetupScreen } from '../screens/signup/ProfileSetupScreen';
import { PaywallScreen } from '../screens/signup/PaywallScreen';
import { DoneScreen } from '../screens/signup/DoneScreen';
import { useStackScreenOptions, useTransitions } from './transitions';

const Stack = createStackNavigator<SignupStackParamList>();

/** Sign-up / sign-in flow. Opened as a modal via navigate('Signup') from anywhere. */
export const SignupNavigator = () => {
  const screenOptions = useStackScreenOptions();
  const { fade } = useTransitions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AuthMethod" component={AuthMethodScreen} />
      <Stack.Screen name="EmailEntry" component={EmailEntryScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      {/* The finish line fades in rather than sliding, and can't be swiped back from. */}
      <Stack.Screen name="Done" component={DoneScreen} options={fade} />
    </Stack.Navigator>
  );
};
