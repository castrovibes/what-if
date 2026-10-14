import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PromptsStackParamList } from './types';
import { PromptsScreen } from '../screens/PromptsScreen';
import { PromptScreen } from '../screens/PromptScreen';
import { ModulesScreen } from '../screens/ModulesScreen';
import { ModuleDetailScreen } from '../screens/ModuleDetailScreen';
import { MadLibsScreen } from '../screens/MadLibsScreen';
import { FAQScreen } from '../screens/FAQScreen';
import { ImConcernedScreen } from '../screens/ImConcernedScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';

const Stack = createStackNavigator<PromptsStackParamList>();

export const PromptsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PromptsMain" component={PromptsScreen} />
      <Stack.Screen name="Prompt" component={PromptScreen} />
      <Stack.Screen name="Modules" component={ModulesScreen} />
      <Stack.Screen name="ModuleDetail" component={ModuleDetailScreen} />
      <Stack.Screen name="MadLibs" component={MadLibsScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="ImConcerned" component={ImConcernedScreen} />
      <Stack.Screen name="Personalization" component={PersonalizationScreen} />
    </Stack.Navigator>
  );
};
