import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { OnboardingNavigator } from '../navigation/OnboardingNavigator';
import { MainTabNavigator } from '../navigation/MainTabNavigator';
import { LoadingScreen } from '../screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
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
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error setting launch flag:', error);
    }
  };

  if (isFirstLaunch === null || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingNavigator onComplete={completeOnboarding} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
