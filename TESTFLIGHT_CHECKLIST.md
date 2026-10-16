# TestFlight Readiness Checklist

Goal: a build of What Could You Do? that beta testers can install from TestFlight and use outside the dev environment.

**Owner:** **You** = needs your accounts, decisions, or content. **Claude** = code work in this repo.
**Phases:** 1 → 2 gets an **internal** beta (up to 100 App Store Connect users, no Apple review). Add phase 3 for an **external** beta (public link or invited testers, needs Beta App Review). Phase 4 is what makes sign-up and plans real.

---

## Phase 1 — Accounts and build pipeline

- [ ] **You:** Enroll in the Apple Developer Program ($99/year) if not already.
- [ ] **You:** Create the app in App Store Connect with bundle ID `com.whatcouldyoudo.app`.
- [ ] **You:** Create an Expo account (for EAS Build, Expo's cloud build service), then run `npx eas-cli login` and `npx eas-cli init` once. This links the project and adds its ID to `app.json`.
- [x] **Claude:** Add `eas.json` with `preview` (internal) and `production` (TestFlight, auto-incrementing build number) profiles and a submit profile. Scripts: `npm run build:ios`, `npm run submit:ios`.
- [x] **Claude:** Add a **placeholder** 1024×1024 app icon (pink background, white speech bubble with "?") in `assets/images/` and the iOS asset catalog, plus an Android adaptive icon.
- [ ] **You (design):** Replace the placeholder icon with the final design, and decide on a splash screen.
- [x] **Claude:** Set version and build-number handling (`app.json` version 1.0.0; EAS keeps and auto-increments the build number remotely).
- [x] **Claude:** Declare export compliance (`ITSAppUsesNonExemptEncryption: false`) in `app.json` and `ios/…/Info.plist`.
- [x] **Claude:** Bring the checked-in `ios/` project up to date with new native modules (`pod install`: datetimepicker, expo-speech).
- [x] **Claude:** Fix the native iOS project's identity. The bundle ID was `org.name.WhatCouldYouDo`, which wouldn't match App Store Connect; it's now `com.whatcouldyoudo.app`, version 1.0.0, with a proper home-screen name (now "What If?").
- [x] **Claude:** Smoke-test a Release build in the simulator. Confirmed: no sign-up offer, row or card; no I'm Concerned; no dev tools; no placeholder tags; Report falls back to TestFlight feedback.
- [x] **You:** Choose the home-screen name. Decided: **"What If?"** (iOS display name and `app.json`). In-app titles still say "What Could You Do?".
- [ ] **Claude:** Smoke-test a release build on a real device before the first upload (needs your Apple account for signing).
  - Local native builds fail from this folder: the space in iCloud's `Mobile Documents` path breaks Expo's `expo-constants` build script. EAS cloud builds aren't affected. For local release builds, use a checkout in a path without spaces, or move the project out of iCloud Drive (it's also much faster there).

## Phase 2 — Make the app safe to hand to testers

- [x] **Claude:** Hide dev-only UI in release builds (`FeatureFlags.showDevTools`). The "Replay First Launch (Dev)" row and the sign-up `[MOCK]`/dev notes only appear in development.
- [x] **You:** Decide what sign-up does in the first beta. Decided: **hidden until the backend is live**.
- [x] **Claude:** `FeatureFlags.showSignup` hides the sign-up offer, Profile's sign-up card, the Settings row and "See plans" in builds. Set `EXPO_PUBLIC_ENABLE_SIGNUP=true` once the Firebase project exists.
- [x] **You:** Decide how the paywall behaves in beta. Decided: **"Free during beta"**, and every tester gets Premium.
- [x] **Claude:** `FeatureFlags.betaFreeAccess` (`EXPO_PUBLIC_BETA_FREE_ACCESS`, on by default) shows plans as "Free during beta" and drives `isPremium`.
- [ ] **You (content team):** Deliver the real prompt library. All prompts, tips, twists, FAQ and series are still `[PLACEHOLDER]` seed data.
- [x] **You:** Approve importing the 290-prompt library.
- [x] **Claude:** Add a placeholder `Ethical_Choices_App_Full_Prompt_Library.xlsx` (the 12 placeholder prompts, same columns, dropdowns, Read Me sheet) so the file exists. The content team will replace its rows.
- [ ] **Claude:** Import it through a new migration. Professional (therapeutic) prompts stay hidden unless `isProfessional`.
- [ ] **You + clinician advisor:** Clinical review of "I'm concerned".
- [x] **Claude:** Gate "I'm concerned" behind `FeatureFlags.showImConcerned`: on in development, off in builds unless `EXPO_PUBLIC_SHOW_IM_CONCERNED=true`.
- [x] **Claude:** Wire **Listen** to text-to-speech (`expo-speech`). It reads the prompt and full question, becomes Stop while speaking, and is hidden when Settings > Text-to-Speech is off (now a real, saved setting).
- [x] **Claude:** Label the controls that do nothing yet, so testers don't report them as bugs. They show "Coming soon"; About shows the version; Notifications reads "Coming soon" and is disabled; Community has a Preview notice; Profile's activity numbers are marked as sample data.
- [x] **You:** Decide where **Report** (flag icon) reports go. Decided: a **Firestore `reports` collection**.
- [x] **Claude:** Wire Report to it: a reason picker, then an anonymous, create-only `reports/{id}` record. Until a Firebase project exists, builds ask testers to use TestFlight feedback instead.
- [ ] **Claude (recommended):** Add crash reporting (e.g. Sentry) so beta crashes reach us.
- [ ] **You:** Add internal testers in App Store Connect and upload the first build.

## Phase 2b — Gaps from the object brainstorm board

Your brainstorm board (objects, attributes and actions) compared with what's built. The data layer covers most objects; the gaps are mostly actions (CTAs) that have no screen yet. Items 1, 2 and 5 are the ones testers would notice.

1. **Notes: "Give Feedback".** Reflections (note plus a 1–5 emoji rating) are stored and synced, but nothing in the app creates one since the redesign removed the "How did that go?" pop-up.
   - [ ] **You:** Decide where a note is written: a button on the prompt card, a prompt after skipping, or a Notes tab.
   - [ ] **Claude:** Build it, plus a list of past notes.
2. **Bookmarks: "Save" and folders.** The ♥ saves favorites (synced), but no screen lists them. Folders/Categories (name, description, prompts, Edit) aren't built.
   - [ ] **You:** Decide whether the beta needs folders, or a simple "Saved" list is enough.
   - [ ] **Claude:** Build the Saved list, then folders if wanted. Folders would also need the data model, rules and sync.
3. **User: first name, last name, role.** Not collected today; Profile shows a fixed label.
   - [ ] **You:** Decide on **Role** (Parent / Educator / Counselor / Therapist…). It's useful for the Professional tier.
   - [ ] **You:** Decide whether real **first and last names** are needed (e.g. for community posts), given they add personal data to protect.
   - [ ] **Claude:** Add the chosen fields to the profile step, the user object, the rules and Edit Profile.
4. **Naming: "Context".** On the board, Context means the *situation* (in the car, a restaurant). In the code it means *who you're talking with* ("Quick Start", "Group A"), and situations are called "liminal spaces".
   - [ ] **You:** Agree on names. Suggested: **Situation** for the board's meaning, **Group** for who you're talking with.
   - [ ] **Claude:** Rename in the UI and code; Firestore collection names change too, so do this before real users exist.
5. **Settings: Safety.** The three content-filter options (all user content / after vetting / friends only) sit on Profile, but the choice isn't saved or synced.
   - [ ] **Claude:** Move it to Settings, save it, and sync it with the other preferences.
6. **Post, Article, and the Prompt's "Settings" attribute.** These have no attributes defined yet. Community shows sample posts only; nothing in the app corresponds to Article (the closest are the FAQ and the I'm Concerned resources).
   - [ ] **You:** Define Post and Article (attributes and actions), and what the Prompt's "Settings" attribute means.
7. **Mad Libs prompts don't sync.** Prompts saved from Mad Libs are stored as the user's own prompts on the phone, but aren't part of cloud sync.
   - [ ] **Claude:** Add them to sync (data model, rules, outbox).

## Phase 3 — External beta (Beta App Review)

- [ ] **You:** Publish a **privacy policy URL**. External TestFlight requires one. It must cover email, username, birthdate and photo for accounts.
- [ ] **You:** Fill in the Test Information: beta description, feedback email, and what to test.
- [ ] **You:** If sign-in is needed to review the app, provide a demo account for Apple's reviewers.
- [ ] **You:** Decide the **minimum account age**. The code assumes 18+ (adult facilitators). Under-13 users bring in COPPA (US) and GDPR-K (EU) obligations.
- [ ] **You:** Reconcile the "no PII stored" principle in CLAUDE.md with accounts, which do store adult PII. Update the privacy policy and App Store privacy labels to match.

## Phase 4 — Real backend for sign-up and plans

The app talks to `AuthService` / `BillingService` (`src/auth/types.ts`). A real implementation replaces `mockAuthService.ts` without changing the screens.

- [x] **You:** Choose the backend. Decided: **Firebase** (Auth + Firestore), syncing accounts and user data (contexts, favorites, reflections, series progress). Prompt content stays bundled in the app.
- [x] **Claude:** Build the data model (`src/backend/model.ts`), Firestore security rules with 18 tests (`npm run test:rules`), and a local emulator setup (`npm run emulators`).
- [ ] **You:** Create the real Firebase project (separate dev and prod projects recommended), add an iOS app with bundle ID `com.whatcouldyoudo.app`, and share the web config keys. **Claude** will deploy the rules.
- [ ] **You:** Decide whether personalization (the child's name, town and interests) may ever sync. Today it is deliberately device-only.
- [x] **Claude:** Connect the app to Firebase (JS SDK, emulators in development) and replace the mock `AuthService` with Firebase Auth. Sign-in creates `users/{uid}`; the profile step claims a unique username. Verified end to end against the emulators.
- [x] **Claude:** Switch email sign-in to Firebase **magic links**. The Verify Code screen is now "Check your email" and continues automatically; the app handles sign-in links that open it.
- [ ] **You:** Set up a link domain for magic links (Firebase Hosting) and iOS Associated Domains, so tapping the email link opens the app.
- [x] **Claude:** Sync user data (contexts, favorites, reflections, series progress) between the on-device SQLite database and Firestore. It uses an offline-safe outbox, uploads pre-sign-in data on a device's first sync, pulls the cloud copy on sign-in, and clears the device on sign-out.
- [x] **Claude:** Sync preferences: dark mode and active context go to `users/{uid}.preferences`; the preferred age range syncs with its context. On sign-in the account's saved preferences win; if it has none, this device's choices are saved to it.
- [ ] **You:** Set up Sign in with Apple (a capability in the Apple Developer account) and the Google OAuth client IDs. **Claude** will add `expo-apple-authentication` and Google sign-in.
- [ ] **Claude:** Create accounts and sessions on the server, link Apple, Google and email logins to one account, and have the server decide new vs. returning users.
- [ ] **Claude:** Check username availability on the server (unique names, profanity filter).
- [ ] **You:** Create the subscription products in App Store Connect and Google Play, and set real prices. They are "$X.XX/month" today.
- [ ] **Claude:** Integrate in-app purchases (RevenueCat recommended): receipt validation, **Restore Purchases** (Apple requires it), and unlocking Premium and Professional content from the plan.
- [x] **Claude:** Add in-app **account deletion** (Apple requires it). It runs client-side: it deletes synced data, the account and username claim, then the sign-in, and asks for a fresh sign-in first if needed.
- [ ] **Claude:** Add profile photo upload (`expo-image-picker` + storage).
- [ ] **You:** Define **parental consent** for Premium ("Parental consent required").
- [ ] **You:** Define **professional verification** for Professional ("For verified educators & therapists"): license lookup or manual review.

## Done

- [x] Sign-up flow UI (six screens) on a swappable mock backend
- [x] Native birthdate picker (`@react-native-community/datetimepicker`)
