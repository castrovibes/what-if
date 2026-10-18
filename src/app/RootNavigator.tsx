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

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { setSignupOfferPending } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { enter, modal, fade } = useTransitions();

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
          'Inter-MediumItalic': require('../../assets/fonts/Inter-MediumItalic.ttf'),
          'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
          'Geomini-SemiBold': require('../../assets/fonts/Geomini-SemiBold.ttf'),
          'Geomini-Bold': require('../../assets/fonts/Geomini-Bold.ttf'),
          'Geomini-ExtraBold': require('../../assets/fonts/Geomini-ExtraBold.ttf'),
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

  // Finishing onboarding swaps the Onboarding screen for MainApp; the stack animates that
  // swap with MainApp's options, so `enter` slides the app in from the left. (On a normal
  // launch MainApp is the first screen and doesn't animate.)
  return (
    // The app fades in over the loading screen (the same image as the launch screen):
    // on first launch the Welcome screen matches it exactly; otherwise it cross-fades.
    <FadeIn backdrop={<LoadingScreen />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingNavigator onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp" component={MainTabNavigator} options={enter} />
        )}
        <Stack.Screen name="Signup" component={SignupNavigator} options={modal} />
        {/* The Welcome guide replayed from the You tab: the same Welcome + tips deck as
            first launch, presented above the tabs so the tab bar is out of the way.
            Finishing it returns to the Prompts tab. */}
        <Stack.Screen name="WelcomeGuide" options={fade}>
          {({ navigation }) => (
            <OnboardingNavigator
              onComplete={() => {
                navigation.goBack();
                navigation.navigate('MainApp', { screen: 'Prompts' });
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </FadeIn>
  );
};
