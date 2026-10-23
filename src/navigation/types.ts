import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: NavigatorScreenParams<MainTabParamList> | undefined;
  /**
   * Sign-up / sign-in flow, presented modally over wherever the user is. `mode: 'login'`
   * opens it for a returning user: no sign-up pitch or step counter.
   */
  Signup: { mode?: SignupMode } | undefined;
  /** The Welcome guide replayed from the You tab: full screen, above the tabs. */
  WelcomeGuide: undefined;
};

export type SignupMode = 'signup' | 'login';

export type SignupStackParamList = {
  AuthMethod: undefined;
  EmailEntry: undefined;
  CheckEmail: { email: string };
  ProfileSetup: undefined;
  Paywall: undefined;
  /** `returning`: an existing account signed back in, rather than a new one. */
  Done: { returning?: boolean } | undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  WelcomeTutorial: undefined;
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
  /** Favorites (♥) for the active group, playable in the deck. */
  SavedPrompts: undefined;
  Personalization: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
};

export type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
};

export type CreateStackParamList = {
  CreateMain: undefined;
  PromptBuilder: undefined;
  /** Write a prompt (optionally for `ageGroup`), or edit one of yours with `promptId`. */
  PromptEditor: { promptId?: string; ageGroup?: string } | undefined;
  MyPrompts: undefined;
  /** Notes, by folder tab; opens on `folderId` if given. */
  Notebook: { folderId?: string } | undefined;
  /**
   * Write a note, or edit one with `noteId`. `promptId` preselects the prompt it's about;
   * `folderId` is where a new note goes (General if omitted).
   */
  NoteEditor: { noteId?: string; promptId?: string; folderId?: string } | undefined;
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
  ModuleDetail: { moduleId: string };
  PromptBuilder: undefined;
  FAQ: undefined;
  ImConcerned: undefined;
  Personalization: undefined;
};
