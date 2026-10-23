# Android Checklist

Goal: an Android version of What If? that keeps the app's brand but feels native on Android, without designing or maintaining the screens twice.

**Owner:** **You** = needs your accounts, decisions, or design input. **Claude** = code work in this repo.

---

## Approach

Keep **one brand** on both platforms: the purple and pink palette, Geomini and Inter, the cards, and the age-group colors. Adapt **platform conventions** in the shared kit (`src/ui/`), not in screens. Screens already take their colors, radii and shadows from `useSurface()` and are built from kit components, so changes there reach every screen.

There are three ways to make something differ per platform. Use the smallest one that works:

1. **Values: `Platform.select`.** One-off differences in a style or token, e.g. `Platform.select({ ios: 20, android: 16 })`. Put these in the theme layer (`src/ui/surface.ts`, `src/theme/themes.ts`) rather than in screens.
2. **Components: platform file extensions.** `Button.ios.tsx` and `Button.android.tsx` side by side; Metro picks the right one for `import … from './Button'`, so callers don't change. Use this when behavior differs, not just appearance.
3. **Whole screens.** Possible the same way, but avoid it: every forked screen is two screens to maintain and test.

Today only four files branch on platform (`transitions.tsx`, `reports.ts`, `SignupChrome.tsx`, `useAccountActions.ts`), all for small things like keyboard handling and the action sheet.

---

## Phase 1: See where it stands

- [ ] **Claude:** Generate the Android project and run the app (`npx expo run:android` on an emulator, or an EAS `preview` build for a real phone). `android/` isn't in the repo yet; Expo generates it on demand.
- [ ] **Claude:** Review every screen on Android in light and dark mode, and the deck at the largest text size. List what looks or behaves wrong.
- [ ] **You:** Go through that list and decide what to adapt, what to keep identical, and what can wait.

## Phase 2: Decisions

- [ ] **You:** Confirm the approach: one brand, platform conventions in the kit.
- [ ] **You:** Decide whether to adopt either platform's newest look. iOS 26 has **Liquid Glass** (translucent, blurred chrome; Expo SDK 54 has `expo-glass-effect`) and Android has **Material 3 Expressive**. Either mostly affects the tab bar, headers and sheets.
- [ ] **You:** Decide the Android tab bar: keep the floating pill on both platforms, or use a Material navigation bar on Android.

## Phase 3: Adapt the kit (`src/ui/`)

What Android users expect, and where it goes:

- [ ] **Claude:** **Tap feedback:** a ripple on Android (`Pressable`'s `android_ripple`) where iOS fades the opacity. Button, ListRow, Pill, and the deck's controls.
- [ ] **Claude:** **Sheets:** a Material-style `BottomSheet` on Android, or confirm the current one feels right.
- [ ] **Claude:** **Confirmations:** decide whether toasts become a Material snackbar on Android (`src/ui/toast.tsx`).
- [ ] **Claude:** **Shadows:** check Android `elevation` against the iOS soft shadows; the surface tokens already set both, but the values may need tuning, especially in dark mode.
- [ ] **Claude:** **Scrolling:** no iOS-style bounce at the end of lists; check that nothing relies on it.
- [ ] **Claude:** **Back:** the system back gesture and button through every flow (React Navigation handles the stacks; check the modals, the deck's twist side, sheets and the age menu).
- [ ] **Claude:** **Edge-to-edge and insets:** the floating tab bar, `useTabBarInset()` and the status and navigation bars on Android.
- [ ] **Claude:** **Fonts:** check Geomini and Inter render at the intended weights; never pair `fontWeight` with a custom family (Android fakes the weight).
- [ ] **Claude:** **Haptics:** check each strength on an Android phone; Android vibration motors vary a lot.
- [ ] **Claude:** **Launch screen and icon:** check the splash and the adaptive icon (`assets/images/adaptive-icon.png` on deep purple) on a few launchers.

## Phase 4: Android-specific setup

- [ ] **You:** Create a Google Play Console developer account (one-time $25) and the app with package name `com.whatcouldyoudo.app`.
- [ ] **Claude:** **Sign-in links on Android:** the iOS link domain doesn't cover Android. Android App Links need an `assetlinks.json` on the same Firebase Hosting site (`firebase/hosting/.well-known/`) with the app's signing certificate SHA-256, plus an intent filter in `app.json`. EAS can provide the fingerprint.
- [ ] **Claude:** Add `build:android` and `submit:android` scripts (the `eas.json` profiles already work for Android; `production` makes the app bundle Google Play wants), and a submit profile for the Play Console's internal testing track.
- [ ] **Claude:** Add "check on Android" to the UI rules in CLAUDE.md, next to the dark mode and large-text checks.
