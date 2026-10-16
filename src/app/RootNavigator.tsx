import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { OnboardingNavigator } from '../navigation/OnboardingNavigator';
import { MainTabNavigator } from '../navigation/MainTabNavigator';
import { LoadingScreen } from '../screens/LoadingScreen';
import { SignupNavigator } from '../navigation/SignupNavigator';
import { useAuth } from '../auth/AuthProvider';
import { FadeIn, useTransitions } from '../navigation/transitions';
import { useSurface } from '../ui/surface';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { setSignupOfferPending } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { fade, modal } = useTransitions();
  const surface = useSurface();

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
          'Inter-MediumItalic': require('../../assets/fonts/Inter-MediumItalic.ttf'),
          'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunchedBefore');
        setIsFirstLaunch(hasLaunched === null);
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(true);
      }
    };

    checkFirstLaunch();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunchedBefore', 'true');
      // Offer (optional) sign-up once the main app appears.
      setSignupOfferPending(true);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error setting launch flag:', error);
    }
  };

  if (isFirstLaunch === null || !fontsLoaded) {
    return <LoadingScreen />;
  }

  // The app fades in over the loading screen; finishing onboarding cross-fades into it.
  return (
    <FadeIn backdrop={surface.screen}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingNavigator onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp" component={MainTabNavigator} options={fade} />
        )}
        <Stack.Screen name="Signup" component={SignupNavigator} options={modal} />
      </Stack.Navigator>
    </FadeIn>
  );
};
