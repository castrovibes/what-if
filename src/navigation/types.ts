export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
  /** Sign-up / sign-in flow, presented modally over wherever the user is. */
  Signup: undefined;
};

export type SignupStackParamList = {
  AuthMethod: undefined;
  EmailEntry: undefined;
  CheckEmail: { email: string };
  ProfileSetup: undefined;
  Paywall: undefined;
  Done: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  WelcomeTutorial: undefined;
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
  PromptsMain: { ageGroup?: string; liminalSpace?: string } | undefined;
  Reflection: { promptId: string };
  Modules: undefined;
  ModuleDetail: { moduleId: string };
  MadLibs: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
  Personalization: undefined;
};
