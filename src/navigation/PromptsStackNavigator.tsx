import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PromptsStackParamList } from './types';
import { PromptScreen } from '../screens/prompt/PromptScreen';
import { useStackScreenOptions } from './transitions';

const Stack = createStackNavigator<PromptsStackParamList>();

/**
 * The Prompts tab: the deck. Series live in Explore, the Prompt Builder in Create, and Settings
 * live on the You tab (with FAQ and Personalize).
 */
export const PromptsStackNavigator = () => {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PromptsMain" component={PromptScreen} />
    </Stack.Navigator>
  );
};
