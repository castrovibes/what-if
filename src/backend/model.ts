/**
 * Cloud data model (Firestore). Security rules in firebase/firestore.rules enforce it.
 *
 *   users/{uid}                              UserDoc — the account / user object
 *   users/{uid}/contexts/{contextId}         ContextDoc — who the user talks with ("Quick Start", "Group A")
 *   users/{uid}/favorites/{contextId__promptId}             FavoriteDoc
 *   users/{uid}/reflections/{reflectionId}                  ReflectionDoc
 *   users/{uid}/moduleProgress/{contextId__moduleId__promptId}  ModuleProgressDoc
 *   users/{uid}/myPrompts/{promptId}         MyPromptDoc — prompts the user wrote
 *   usernames/{usernameLower}                UsernameDoc — makes usernames unique
 *
 * Prompt content (prompts, tips, series, …) stays bundled in the app's SQLite DB;
 * only the user's own prompts (My Prompts) sync.
 *
 * Privacy: these documents hold the ADULT account holder's data. Nothing here may
 * identify a child. Personalization (child's name, town, interests) is deliberately
 * NOT synced; contexts must use anonymous labels.
 */
import type { Timestamp } from 'firebase/firestore';
import type { AgeGroupId } from '../data/ageGroups';
import type { AuthProvider, PlanId } from '../auth/types';

export const SCHEMA_VERSION = 1;

/** The account. One per Firebase Auth user; document id = auth uid. */
export type UserDoc = {
  schemaVersion: number;
  /** What the app calls them; free text, up to 40 characters. Null until the profile step. */
  displayName: string | null;
  /** When they confirmed they're an adult (18+) in the profile step; null until then. */
  ageConfirmedAt: Timestamp | null;
  /** Legacy unique handle (no longer collected). Null, or claimed in usernames/. */
  username: string | null;
  /** Lowercase username; must match a usernames/{usernameLower} claim owned by this user. */
  usernameLower: string | null;
  /** From the sign-in provider; must equal the auth token's email. */
  email: string | null;
  authProvider: AuthProvider;
  /** Legacy YYYY-MM-DD (no longer collected). When set, rules require 18+. */
  birthdate: string | null;
  photoUrl: string | null;
  /** Set by the server (purchase validation) only; clients can't change it. */
  plan: PlanId;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type UserPreferences = {
  /** null = follow the device. */
  darkMode: boolean | null;
  activeContextId: string | null;
};

/** Mirrors the local `contexts` table. `label` must be anonymous (no child names). */
export type ContextDoc = {
  label: string;
  ageGroupDefault: AgeGroupId | null;
  isAnonymous: boolean;
  colorToken: string | null;
  createdAt: Timestamp;
  archivedAt: Timestamp | null;
  updatedAt: Timestamp;
};

export type FavoriteDoc = {
  contextId: string;
  promptId: string;
  favoritedAt: Timestamp;
};

/** Mirrors local `reflections`, minus the on-device audio file. */
export type ReflectionDoc = {
  contextId: string;
  promptId: string;
  /** Free text written by the adult; may be sensitive. Max 5,000 characters. */
  note: string | null;
  /** 1–5 */
  rating: number | null;
  createdAt: Timestamp;
};

export type ModuleProgressDoc = {
  contextId: string;
  moduleId: string;
  promptId: string;
  completedAt: Timestamp | null;
};

/**
 * A prompt the user wrote (Create → Write a prompt, or the Prompt Builder). Free text by the
 * adult, like reflection notes; it may mention people, so treat it as personal data.
 * Deleting sets `deleted` rather than removing the document, so favorites and notes
 * that refer to it on other devices stay valid.
 */
export type MyPromptDoc = {
  text: string;
  ageGroup: AgeGroupId;
  /** Situation ids ("ls-car-ride", …). */
  situations: string[];
  deleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type UsernameDoc = {
  uid: string;
  createdAt: Timestamp;
};

/** Collections under users/{uid} that sync from the device. */
// myPrompts comes first so that, when the device is rebuilt from the cloud copy, the
// prompts exist before the favorites and notes that refer to them.
export const USER_COLLECTIONS = [
  'myPrompts',
  'contexts',
  'favorites',
  'reflections',
  'moduleProgress',
] as const;
export type UserCollection = (typeof USER_COLLECTIONS)[number];

export const paths = {
  user: (uid: string) => `users/${uid}`,
  userCollection: (uid: string, collection: UserCollection) => `users/${uid}/${collection}`,
  username: (usernameLower: string) => `usernames/${usernameLower}`,
};

export const docIds = {
  favorite: (contextId: string, promptId: string) => `${contextId}__${promptId}`,
  moduleProgress: (contextId: string, moduleId: string, promptId: string) =>
    `${contextId}__${moduleId}__${promptId}`,
};

/** Same rule as the client check and firestore.rules. */
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
