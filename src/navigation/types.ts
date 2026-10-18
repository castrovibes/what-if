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
};

export type MainTabParamList = {
  Prompts: undefined;
  Explore: undefined;
  Create: undefined;
  You: undefined;
};

/** The You tab: account, activity, preferences, help. (Profile and Settings, merged.) */
export type YouStackParamList = {
  YouMain: undefined;
  Personalization: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
  /** The Welcome Guide: the welcome screen, then the tips deck. */
  Welcome: undefined;
  WelcomeTutorial: undefined;
};

export type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
};

export type CreateStackParamList = {
  CreateMain: undefined;
  MadLibs: undefined;
  /** Write a prompt (optionally for `ageGroup`), or edit one of yours with `promptId`. */
  PromptEditor: { promptId?: string; ageGroup?: string } | undefined;
  MyPrompts: undefined;
};

export type PromptsStackParamList = {
  PromptsMain:
    | {
        ageGroup?: string;
        liminalSpace?: string;
        /** Which prompts the deck shows, and which one goes on top; see deckLinks.ts. */
        source?: 'official' | 'user';
        promptId?: string;
        /** Makes each request to open the deck distinct. */
        opened?: number;
      }
    | undefined;
  Reflection: { promptId: string };
  Modules: undefined;
  ModuleDetail: { moduleId: string };
  MadLibs: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
  Personalization: undefined;
};
