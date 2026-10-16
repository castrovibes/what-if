import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SignupStackParamList } from './types';
import { AuthMethodScreen } from '../screens/signup/AuthMethodScreen';
import { EmailEntryScreen } from '../screens/signup/EmailEntryScreen';
import { VerifyCodeScreen } from '../screens/signup/VerifyCodeScreen';
import { ProfileSetupScreen } from '../screens/signup/ProfileSetupScreen';
import { PaywallScreen } from '../screens/signup/PaywallScreen';
import { DoneScreen } from '../screens/signup/DoneScreen';

const Stack = createStackNavigator<SignupStackParamList>();

/** Sign-up / sign-in flow. Opened as a modal via navigate('Signup') from anywhere. */
export const SignupNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AuthMethod" component={AuthMethodScreen} />
    <Stack.Screen name="EmailEntry" component={EmailEntryScreen} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    <Stack.Screen name="Paywall" component={PaywallScreen} />
    <Stack.Screen name="Done" component={DoneScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);
