# TestFlight Readiness Checklist

Goal: a build of What Could You Do? that beta testers can install from TestFlight and use outside the dev environment.

**Owner:** **You** = needs your accounts, decisions, or content. **Claude** = code work in this repo.
**Phases:** 1 → 2 gets an **internal** beta (up to 100 App Store Connect users, no Apple review). Add phase 3 for an **external** beta (public link or invited testers, needs Beta App Review). Phase 4 is what makes sign-up and plans real.

---

## Phase 1 — Accounts and build pipeline

Step-by-step instructions for the three **You** items below: [TESTFLIGHT_ACCOUNTS_GUIDE.md](TESTFLIGHT_ACCOUNTS_GUIDE.md).

- [ ] **You:** Enroll in the Apple Developer Program ($99/year) if not already.
- [ ] **You:** Create the app in App Store Connect with bundle ID `com.whatcouldyoudo.app`.
- [ ] **You:** Create an Expo account (for EAS Build, Expo's cloud build service), then run `npx eas-cli login` and `npx eas-cli init` once. This links the project and adds its ID to `app.json`.
- [x] **Claude:** Add `eas.json` with `preview` (internal) and `production` (TestFlight, auto-incrementing build number) profiles and a submit profile. Scripts: `npm run build:ios`, `npm run submit:ios`.
- [x] **Claude:** Add a **placeholder** 1024×1024 app icon (pink background, white speech bubble with "?") in `assets/images/` and the iOS asset catalog, plus an Android adaptive icon.
- [x] **You (design):** Replace the placeholder icon with the final design, and decide on a splash screen. Done: the icon is the hand-drawn question mark on its own green (`#bcd901`), edge to edge; the splash is "What If?" in Rock Salt above the question mark, held until the app draws the same image (`tools/graphics/`).
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

Your brainstorm board (objects, attributes and actions) compared with what's built. The data layer covers most objects; the gaps are mostly actions (CTAs) that have no screen yet. Items 1, 2 and 5 are the ones testers would notice; item 8 matters once users can write prompts.

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
   - [x] **Claude:** Done with Phase 2c item 4e: all of the user's own prompts (Mad Libs and Write a prompt) now sync.
8. **Long prompts.** Every prompt card is now the same height (380 pt). Prompt text shrinks to fit, from the title size down to a readable minimum (`title3`, 18–22 pt depending on the phone). Anything still too long at the minimum is cut off. That's fine for the current library, but user-created prompts (Mad Libs, community submissions) could be any length.
   - [x] **Claude:** A **150-character limit** on the blank prompt creator is built (Phase 2c item 4b), so user-written prompts fit today.
   - [ ] **You:** Decide whether to keep the limit or switch to a **multi-page card** for long prompts, e.g. tapping the card to **flip** it and read the rest on the back. Roughly 170 characters fits at the minimum text size.
   - [ ] **Claude:** If you choose the flip: a flip animation plus a "more" cue on cards whose text doesn't fit.

## Phase 2c — Navigation reorganization

Do these **one at a time**: finish, check and commit each before starting the next. Today the tab bar is **Prompts · Community · Profile · Settings**, and the Prompts screen's ☰ menu ("More ways to talk") holds **Series** and **Mad Libs**. The target tab bar is **Prompts · Explore · Create · Profile**, with Settings as a ⚙ button at the top of the screens.

**Suggested order: 2 → 4 → 1 → 3.** Item 1 removes the ☰ menu, so Series (moving to Explore, item 2) and Mad Libs (moving to Create, item 4) should have their new homes first. Otherwise they're unreachable in between.

1. **Settings moves to the top of the screens; the Prompts ☰ menu goes.** Remove the ☰ "More ways to talk" menu from the Prompts screen. Put a ⚙ (gear) button in its place, at the top right, on every tab's main screen; it opens Settings. Settings comes off the tab bar.
   - [x] **You:** Decided: the ⚙ shows on **every** screen, deeper ones included (e.g. a Series, FAQ), alongside their back arrow. Exception: Settings itself and its own deeper screens don't need it.
   - [x] **Claude:** The shared screen header shows a ⚙ (next to any back arrow) that opens **Settings**, which now sits above the tabs and slides in with a back arrow (`src/navigation/SettingsNavigator.tsx`). The ⚙ is hidden inside Settings and its screens and during first-launch onboarding. The Settings tab and the Prompts ☰ menu ("More ways to talk") are gone; the Prompts tab is now just the deck. Checked: Prompts, a Series detail, Help & FAQ, and the Welcome Guide replay (which closes Settings on the Prompts tab).
2. **Community becomes Explore.** Rename the tab and screen to **Explore**. It's the home for **Series** (today under ☰ → Series), **community** content (today's sample posts), and possibly **written content** like guides and blogs. The detailed design comes later.
   - [x] **Claude:** Renamed the tab and screen to Explore (`compass` icon; `src/screens/ExploreScreen.tsx`). It lists the **Series** (shared `SeriesCard`), each opening its detail screen inside the Explore tab, then a **Community** section with the Preview note, "Share your ideas" and the sample posts. No Guides section yet. The Series list is still also reachable from the Prompts ☰ menu until item 1 removes it.
   - [ ] **You (later):** Design the Explore screen in detail: sections, order, and what guides/blogs are (ties in with Phase 2b item 6, defining Post and Article).
3. **Profile moves to the far right of the tab bar.**
   - [x] **Claude:** Done as part of item 1: with Settings off the tab bar, the tabs are **Prompts · Explore · Create · Profile**, and the app still opens on Prompts.
4. **New Create tab.** A tab called **Create** that holds **Mad Libs** (moved from ☰), **notes** (writing a reflection; see Phase 2b item 1), and a **blank prompt creator** (write your own "What if…?").
   - Create sits third, between Explore and Profile.
   - [x] **You:** Decided: the **blank prompt creator is in the beta**.
   - [x] **You:** Decided: **both**. Created prompts live in a **My Prompts** list, and the deck can switch to them. The card's source label ("What If Originals") gets a ⌄ and becomes a dropdown to choose **What If Originals** or **My Prompts**; the creator can also send you straight to your prompts in the deck. The deck shows Originals by default, no longer mixing in your own.
   - Notes depend on the Phase 2b item 1 decision; Create shows them as "Coming soon" until then.
   - Steps, one at a time:
     - [x] **4a. Claude:** Create tab (icon `plus-circle`, third in the tab bar) with a screen listing **Write a prompt**, **Mad Libs** and **Notes** (coming soon); `src/screens/CreateScreen.tsx`. Mad Libs opens inside the Create tab (and still from the Prompts ☰ menu until item 1).
     - [x] **4b. Claude:** Blank prompt creator (`PromptEditorScreen.tsx`): your "What if…?" text (150-character limit for now; see Phase 2b item 8), an age group, and optional situations; a "?" is added if missing. Saving offers **Play in deck**, which opens the Prompts deck on My Prompts for that age group. Mad Libs' save offers the same.
     - [x] **4c. Claude:** **My Prompts** list in Create (`MyPromptsScreen.tsx`): tap to edit, ▶ to play in the deck, 🗑 to delete (hidden, not erased, so notes and favorites that point at it stay valid). Stored on the phone via `UserPromptRepo`.
     - [x] **4d. Claude:** Deck source dropdown on the card's source label (⌄): **What If Originals** / **My Prompts**. The age and situation filters apply to both. An empty My Prompts deck offers **Write a prompt** (for that age group) or **Show What If Originals**. The deck shows Originals by default and no longer mixes in your own.
     - [x] **4e. Claude:** Your prompts sync to your account like favorites: `users/{uid}/myPrompts/{promptId}` (model, rules with 2 new tests, 27 passing; outbox; adopted on first sign-in; pulled down on sign-in; cleared from the phone on sign-out; removed with the account). Deleting syncs as `deleted: true`. Verified against the emulators: upload, sign-out/sign-in round trip, and a live edit.

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
- [x] **You:** Create the **dev** Firebase project (`what-if-dev-70316`, Spark plan) with Email link sign-in and Firestore. **Claude** deployed the rules and indexes and put its config in `.env` (git-ignored). Sign-up verified end to end against it on 2026-10-17 (test account `whatifdevtest1`). Back to the emulators: set `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`.
- [ ] **You:** Create the **prod** Firebase project the same way (Web app + iOS app with bundle ID `com.whatcouldyoudo.app`, Email link sign-in, Firestore in production mode, region `nam5`) and share its web config. **Claude** will deploy the rules and set the keys as EAS environment variables.
- [ ] **You:** Upgrade to the **Blaze** plan (pay-as-you-go) before outside testers sign in, and set a budget alert (e.g. $10) in Google Cloud Billing. Spark sends only **5 sign-in emails a day** per project; Blaze allows 25,000 with the same free allowances.
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

## Design critique pass (2026-10-17)

Decisions from the founder/designer critique, recorded here because some reverse earlier items above:

- **Tabs are Prompts · Explore · Create · You.** Profile and Settings merged into **You** (`src/screens/you/`); the ⚙ is gone from every header (reverses 2c item 1's "⚙ on every screen"). An **Explore redesign** is on the to-do list (see 2c item 2's open "You (later)" item).
- **Onboarding is one screen.** Welcome → Get Started → the deck's age pick. Twist and Tips introduce themselves with one-time in-place hints. The tips deck survives as **Welcome guide** on You.
- **Returning users skip the cover.** With a preferred age range set, the deck opens on the first prompt.
- **Twist and Tips hide when a prompt has none** (not dimmed). Prompt cards grow with the system text size.
- **Haptics** on swipe, flip, favorite, twist change and saves (`expo-haptics`).
- **Toasts replace alerts** for confirmations (saved, report sent, About); native alerts stay for log out / delete. "Coming soon" controls say so inline and show a beta toast when tapped. Sample community posts and activity numbers stay, labeled, until there are real users.
- **Sign-up profile step:** a display name (no username, no availability check) and an "I'm 18 or older" confirmation (no birthdate picker). The plan step stays for demos. Firestore: new `displayName` / `ageConfirmedAt` fields; `username` / `birthdate` remain nullable legacy fields (rules and tests updated).
- **Brand-tinted neutrals** in both themes; the tab bar and modals use the same surface tokens. Two radii (20 cards, 14 controls). Micro-labels in Inter-SemiBold. No `fontWeight` / `fontStyle` with custom fonts.
- **App icon:** white mark on deep purple at ~80% of the tile.
- **Backups** live in `.backups/` (git-ignored), not beside the source.
- [ ] **You:** Decide the Twist button's icon (kept `shuffle` for now; Previous prompt is `corner-up-left`).
- [ ] **Claude:** Tab-bar mockup with the question-mark glyph for Prompts, before changing it.
- [ ] **You (later):** Explore redesign.
