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
- [ ] **Claude:** Bring the checked-in `ios/` project up to date with new native modules (`@react-native-community/datetimepicker` was added after the last `pod install`). EAS runs `pod install` during builds; local Xcode builds need `npx pod-install` first.
- [ ] **Claude:** Run a release build and smoke-test it on a real device before the first upload.

## Phase 2 — Make the app safe to hand to testers

- [ ] **Claude:** Hide dev-only UI in release builds. The "Replay First Launch (Dev)" row currently shows in all builds. The sign-up `[MOCK]` notes are already dev-only.
- [ ] **You:** Decide what sign-up does in the first beta, until Phase 4 exists:
  - (a) ship the mock, so accounts live only on the tester's phone and nothing is charged, labeled as beta;
  - (b) hide sign-up for now; or
  - (c) wait for the real backend.
- [ ] **You:** Decide how the paywall behaves in beta. Testers must not think they're paying. Options: hide plans, or show them as "Free during beta".
- [ ] **Claude:** Replace `FeatureFlags.isPremium: true` (hard-coded) with whatever the beta decision is.
- [ ] **You (content team):** Deliver the real prompt library. All prompts, tips, twists, FAQ and series are still `[PLACEHOLDER]` seed data.
- [ ] **Claude:** Import the 290-prompt library (`Ethical_Choices_App_Full_Prompt_Library.xlsx`) through a new migration once it's approved.
- [ ] **You + clinician advisor:** "I'm concerned" must not reach external testers before clinical review. **Claude** will hide it behind a flag for builds that aren't internal.
- [ ] **Claude:** Wire **Listen** to text-to-speech (`expo-speech`). The button currently does nothing.
- [ ] **Claude:** Hide or label the controls that do nothing yet, so testers don't report them as bugs: Edit Profile, Email Preferences, Privacy & Security, Language, Contact Support, About, Upgrade Now, Learn More, Community filters and post actions, and Create New Prompt.
- [ ] **Claude:** Make **Report** (flag icon) send the report somewhere: email, a form, or the backend.
- [ ] **Claude (recommended):** Add crash reporting (e.g. Sentry) so beta crashes reach us.
- [ ] **You:** Add internal testers in App Store Connect and upload the first build.

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
- [ ] **Claude:** Connect the app to Firebase (JS SDK, emulators in development) and replace the mock `AuthService` with Firebase Auth.
- [ ] **Claude:** Switch email sign-in to Firebase **magic links** (decided). The Verify Code screen becomes "Check your email", plus deep-link handling.
- [ ] **You:** Set up a link domain for magic links (Firebase Hosting) and iOS Associated Domains, so tapping the email link opens the app.
- [ ] **Claude:** Sync user data between the on-device SQLite database and Firestore (upload on sign-in, keep in sync, merge across devices).
- [ ] **You:** Set up Sign in with Apple (a capability in the Apple Developer account) and the Google OAuth client IDs. **Claude** will add `expo-apple-authentication` and Google sign-in.
- [ ] **Claude:** Create accounts and sessions on the server, link Apple, Google and email logins to one account, and have the server decide new vs. returning users.
- [ ] **Claude:** Check username availability on the server (unique names, profanity filter).
- [ ] **You:** Create the subscription products in App Store Connect and Google Play, and set real prices. They are "$X.XX/month" today.
- [ ] **Claude:** Integrate in-app purchases (RevenueCat recommended): receipt validation, **Restore Purchases** (Apple requires it), and unlocking Premium and Professional content from the plan.
- [ ] **Claude:** Add in-app **account deletion** backed by the server (Apple requires it whenever an app has sign-up).
- [ ] **Claude:** Add profile photo upload (`expo-image-picker` + storage).
- [ ] **You:** Define **parental consent** for Premium ("Parental consent required").
- [ ] **You:** Define **professional verification** for Professional ("For verified educators & therapists"): license lookup or manual review.

## Done

- [x] Sign-up flow UI (six screens) on a swappable mock backend
- [x] Native birthdate picker (`@react-native-community/datetimepicker`)
