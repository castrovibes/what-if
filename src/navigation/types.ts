export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  HowToUse: undefined;
};

export type MainTabParamList = {
  Prompts: undefined;
  Community: undefined;
  Profile: undefined;
  Settings: undefined;
  Prompt: undefined;
  Developer: undefined;
  Loading: undefined;
};

export type PromptsStackParamList = {
  PromptsMain: undefined;
  Prompt: { ageGroup: string; liminalSpace?: string };
  Reflection: { promptId: string };
  Modules: undefined;
  ModuleDetail: { moduleId: string };
  MadLibs: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
  Personalization: undefined;
};
