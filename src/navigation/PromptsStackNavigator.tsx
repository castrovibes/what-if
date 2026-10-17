import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PromptsStackParamList } from './types';
import { PromptScreen } from '../screens/PromptScreen';
import { useStackScreenOptions } from './transitions';

const Stack = createStackNavigator<PromptsStackParamList>();

/**
 * The Prompts tab: the deck. Series live in Explore, Mad Libs in Create, and Settings
 * (with FAQ and Personalize) opens from the ⚙ in the header.
 */
export const PromptsStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PromptsMain" component={PromptScreen} />
    </Stack.Navigator>
  );
};
