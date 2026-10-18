# TestFlight accounts: step by step

How to do the three **You** items in Phase 1 of [TESTFLIGHT_CHECKLIST.md](TESTFLIGHT_CHECKLIST.md). These need your accounts and payment, so Claude can't do them. When they're done, Claude can take over builds and testing.

Status on 2026-10-17: none of the three were started. This Mac wasn't logged into Expo, the project wasn't linked to EAS, and there were no Apple signing certificates.

**Order:** start step 1 first, because Apple's approval is the slow part. Step 2 can be done right away, in parallel. Step 3 waits for Apple's approval.

---

## 1. Apple Developer Program

Enroll at [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll). It costs $99 a year. Apple's approval can take a day or two, and an organization enrollment can take longer.

**Decide first: Individual or Organization.**

| | Organization (Digital Ninja), recommended | Individual |
|---|---|---|
| Seller shown on the App Store | The company | Your own name |
| Teammates | Can be added | No |
| Needs | A free **D-U-N-S number** for the company. Apple's form can request one if you don't have it, but that can add days or more. | Just your Apple ID |
| Speed | Slower | Fastest |

Organization fits an app sold to schools and therapists. Switching from Individual to Organization later is possible, but a hassle.

## 2. Expo account (about 5 minutes)

Expo's cloud service (EAS) builds the app and uploads it to Apple.

1. Sign up at [expo.dev/signup](https://expo.dev/signup). The free plan is enough to start.
2. In Terminal, run:

   ```bash
   cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/09_Digital_Ninja/What_If
   npx eas-cli login
   npx eas-cli init
   ```

   `init` links the project and adds its ID to `app.json`. Then tell Claude, who will check the link and commit the change.

## 3. App Store Connect app (after Apple approves you)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → +** → **New App**.
2. Fill in:
   - **Platform:** iOS
   - **Name:** App Store names must be unique, so "What If?" is probably taken. Try something like "What If? Conversations". This only affects the store listing; the home screen still says "What If?".
   - **Primary language:** English (U.S.)
   - **Bundle ID:** `com.whatcouldyoudo.app`. If it isn't in the list, register it first under **Certificates, Identifiers & Profiles → Identifiers**.
   - **SKU:** anything that's yours, for example `whatif-ios`

## After all three

1. Run the first build yourself, because it asks for your Apple ID once. EAS then creates the signing certificates:

   ```bash
   npm run build:ios
   ```

2. Upload it to TestFlight:

   ```bash
   npm run submit:ios
   ```

3. From then on, Claude can handle builds and the real-device smoke test with you. Next on the checklist is adding internal testers in App Store Connect (Phase 2).
