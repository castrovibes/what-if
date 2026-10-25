# CLAUDE.md — What Could You Do? (What If?) App

> This file provides full project context for every Claude Code session.
> Drop it in the root of your repo so Claude Code loads it automatically.

---

## Project Overview

**What Could You Do?** (also referred to as **What If?**) is an ethical decision-making mobile app designed for parents, educators, and therapists to facilitate meaningful conversations with children and teens.

The app presents age-appropriate "What if..." scenarios that encourage critical thinking and ethical reasoning through open-ended discussions rather than seeking predetermined "correct" answers.

**Core Question Format:**
```
"What if [scenario]?"
followed by: "What are all the things you can think of that you could do?"
```

This phrasing is intentional. It encourages brainstorming over judgment, creative thinking over compliance, and genuine expression over one-word answers. The goal is not to teach children what to think, but to help them practice *how* to think through complex situations.

**Mission:** Every child deserves an adult who asks great questions and truly listens to the answers. We're building tools to make that easier.

---

## Target Audience

**Primary users (adults facilitating conversations):**
- Parents and family members
- Teachers and special education professionals
- School counselors and guidance professionals
- Social workers and case managers
- Therapists and behavioral health providers
- Coaches, camp directors, youth program leaders
- Youth pastors and mentors
- Tutors and after-school program staff

**Secondary users:** Children aged 3–15+ (across four age groups)

**Professional users (premium tier):** Teachers, social workers, therapists, school counselors

---

## Design System

### Typography
- **Inter** for everything except headings (bundled in `assets/fonts/`, all three from the same release: `@expo-google-fonts/inter` 0.4.1, OFL-1.1). Loaded in `src/app/RootNavigator.tsx`:
  - `Inter-SemiBold` — list-row titles
  - `Inter-Medium` — body text, labels, descriptions, navigation
  - `Inter-MediumItalic` — the follow-up question on prompt cards ("What are all the things you can think of…"). Use this family rather than `fontStyle: 'italic'`, which iOS ignores for custom fonts.
- **Geomini** for all headings (`assets/fonts/`, both from `@expo-google-fonts/geomini` 0.4.0, OFL-1.1; the package has every weight from 200 to 800 if another is needed). Don't also set `fontWeight`; iOS may then substitute a system font.
  - `Geomini-ExtraBold` — page-level headings: screen titles (`ScreenHeader`; accent purple, title case — not all caps), the sign-up step titles and "You're all set", the tutorial's "Welcome", the module cover title, modal titles, and the startup error title.
  - `Geomini-Bold` — the lighter heading weight, for titles on cards and sheets (bottom sheets, tutorial tips, series and promo cards, You-tab cards, sign-up slides, upsells) and big numbers (activity stats, avatar initials).
  - `Geomini-SemiBold` — lighter still, for display text that isn't a heading: prompt text (the deck's prompt and twist cards, module steps, the Personalize and Mad Libs previews, My Prompts, and the prompt editor), button labels (the kit `Button`), the age options on the deck's age card, the Create screen's card titles, and user names on community posts.
  - Still Inter: other list-row titles, field labels, tags and badges, the small uppercase micro-labels (`SectionLabel`, Tips groups, the age menus, sign-up field labels: all `Inter-SemiBold`, tracked — a rounded display face gets blobby at 11 pt), and the Apple / Google sign-in buttons (their brand rules govern that text).
- Never pair `fontWeight` or `fontStyle` with a custom `fontFamily`: pick the family that already has the weight or slant (`Inter-SemiBold`, `Inter-MediumItalic`). Android fakes the weight and iOS ignores the slant.
- **Launch screen:** "What If?" in Geomini ExtraBold, curved in a gentle arch over the question mark, is drawn into the launch images (`tools/graphics/make_splash.py`; `ARC_RADIUS` sets the curve, and `--preview` compares strengths), which the iOS splash, the in-app `LoadingScreen`, the Welcome screen and the deck's title card all show (light and dark versions). Rerun the script after changing the font or lettering; it also updates the size in `SplashScreen.storyboard`.
- Rock Salt (`assets/fonts/RockSalt-Regular.ttf`) was the launch lettering before Geomini; it's no longer used.
- Barrio and Road Rage are no longer used or loaded (the font files remain in `assets/fonts/`).

### Visual language (set by the prompt card screen)
- Soft purple-tinted gray screen background (light) / near-black with a purple cast (dark); content sits on white rounded cards (radius 20, hairline border, soft shadow). Dark mode uses lighter raised cards and heavier shadows for contrast. The neutrals in `src/theme/themes.ts` are deliberately tinted toward the brand purple, not a stock gray scale; the tab bar and navigation chrome use the same `useSurface()` tokens so every background in a theme matches.
- Hot pink for primary actions and active/selected states; deep purple (lightened in dark mode) for titles, icons and outlines.
- Age-group colors are accents only — a dot, small pill or thin stripe — never full card backgrounds.
- Two radii: `CARD_RADIUS` (20) for cards, sheets, menus and plan cards; `INPUT_RADIUS` (14) for text fields, buttons, toasts and banners. Both in `src/ui/surface.ts`.
- The tab bar is a floating pill (`src/navigation/FloatingTabBar.tsx`): a raised card above the bottom edge, a pink highlight that springs between tabs, and a scrim fading content into the screen color beneath it. Screens get the full height, so anything anchored to the bottom of a tab screen (scroll content, the deck's action row, hints, toasts) pads itself with `useTabBarInset()` from `src/navigation/tabBarInset.ts`; the hook is 0 outside the tabs.
- Filters are pills; secondary choices open bottom sheets. Confirmations are toasts (`toast.show()` in `src/ui/toast.tsx`, drawn by `ToastHost` in App.tsx); a native `Alert` is kept only for destructive confirms (log out, delete). Controls that aren't built yet say so inline ("Coming soon") and, if tapped, show `toast.beta()` rather than an alert.
- Haptics (`src/ui/haptics.ts`): light on a swipe commit or page-turn, medium on the card flip, selection on toggles and twist changes, success on a save.
- One-time hints (`useOneTimeHint` + `HintBubble`) introduce Twist and Tips in place the first time they appear, on top of the first-launch Welcome guide (the tips deck), which can be replayed from the You tab.
- Build screens from the shared kit: `src/ui/surface.ts` (`useSurface()` tokens) and `src/ui/components.tsx` (Screen, ScreenHeader, Card, ListRow, Pill, Button, BottomSheet, …).

### Color Palette (5 colors)
| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Teal | `#00db96` | (0, 219, 150) | Age group 6–8, activity stats, user icons |
| Deep Purple | `#49297e` | (73, 41, 126) | Borders, audio buttons, upgrade gradients, backgrounds |
| Sky Blue | `#90dcff` | (144, 220, 255) | Age group 3–5, welcome gradient, activity stats |
| Hot Pink | `#e10086` | (225, 0, 134) | Primary CTAs, age group 9–12, active states, buttons |
| Bright Yellow | `#fdfb76` | (253, 251, 118) | Age group 13–15+, favorites, accent highlights |

### Age Group → Color Mapping
- **3–5 years:** Sky Blue (`#90dcff`)
- **6–8 years:** Teal (`#00db96`)
- **9–12 years:** Hot Pink (`#e10086`)
- **13–15+ years:** Bright Yellow (`#fdfb76`)

---

## Prompt Library Structure

### Database Schema
Each prompt has these fields:
| Field | Description | Example |
|-------|-------------|---------|
| `#` | Unique prompt ID | `1`, `34B`, `144D` |
| `Age Group` | Target age range | `3-5`, `6-8`, `9-12`, `13+` |
| `Category` | One of 7 categories | `Ethics` |
| `Subcategory` | Specific topic tag | `sharing`, `peer pressure` |
| `Prompt Text` | The "What if..." scenario | `What if you really want a toy...` |
| `Tier` | Access level | `Free`, `Premium`, `Professional` |
| `Full Question` | Standard follow-up | `What are all the things you can think of that you could do?` |

### Categories (7 total)
| Category | Count | Description |
|----------|-------|-------------|
| Ethics | 73 | Everyday moral decisions and social responsibility |
| Emotions | 49 | Identifying, understanding, and managing feelings |
| Rites of Passage | 44 | Growing up milestones and developmental transitions |
| Fun & Imagination | 43 | Creative, silly, lighthearted scenarios (mood-lifters) |
| Travel & Adventure | 30 | Road trips, airports, family travel |
| School Connection | 28 | Replaces "How was school today?" with real engagement |
| Humor & Social Dynamics | 23 | Navigating social humor, teasing, group belonging |

### Age Group Distribution
| Age Group | Prompt Count |
|-----------|-------------|
| 3–5 | 55 |
| 6–8 | 72 |
| 9–12 | 79 |
| 13+ | 84 |
| **Total** | **290** |

### Tier Distribution
| Tier | Count | Percentage | Description |
|------|-------|------------|-------------|
| Free (Kids Safe Mode) | 224 | 77.2% | Safe, positive content |
| Premium (Family Conversations) | 44 | 15.2% | Real-world scenarios, requires parental consent |
| Professional (Therapeutic) | 22 | 7.6% | Sensitive topics for trained facilitators |

### Subcategories
There are 228 unique subcategories spanning topics from `sharing` and `empathy` to `cyberbullying`, `grief`, `identity`, `peer pressure`, `substance experimentation`, and `sexual boundaries`. See `content/Ethical_Choices_App_Full_Prompt_Library.xlsx` for the complete mapping.

---

## App Architecture & Features

### Current App (React Native + Expo)
The app is a React Native app built with Expo (SDK 58, React Native 0.88, React 19.3,
Hermes, New Architecture). It has replaced the earlier React web wireframe; nothing
from that prototype is in this repo.

**Stack, as installed:**
| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 58 managed workflow, with `ios/` committed (run `npx expo prebuild --clean` after changing plugins in `app.json`); Android is generated on demand |
| Navigation | React Navigation 7 (`@react-navigation/stack` + `bottom-tabs`); not Expo Router |
| State | React Context only (`ThemeProvider`, `DbProvider`, `ActiveContextProvider`, `AuthProvider`), plus module-level services under `src/sync/`. No Redux/Zustand |
| Local data | `expo-sqlite` is the source of truth (`src/db/`: migrations + repositories); `AsyncStorage` holds small preferences |
| Backend | Firebase JS SDK (Auth email links, Firestore) via `src/backend/`; local emulators in development, `EXPO_PUBLIC_AUTH_BACKEND=mock` to run without Firebase |
| Sync | Outbox-based: local writes queue in `sync_outbox` and push when signed in (`src/sync/syncService.ts`) |
| Animation | Reanimated 4 (needs the New Architecture, the only one since SDK 55) |
| UI kit | Our own, in `src/ui/` (no React Native Paper / NativeBase) |
| TTS | `expo-speech` |
| Builds | EAS (`eas.json`); see `TESTFLIGHT_CHECKLIST.md` |

**Source layout (layer-based):**
```
App.tsx                      Providers: SafeArea → Theme → ErrorBoundary → Navigation → Db → ActiveContext → Auth
src/app/                     RootNavigator (fonts, onboarding vs main), splash hand-off
src/navigation/              Tab + stack navigators, transitions, deck deep links
src/screens/                 One file per screen; src/screens/prompt/ holds the prompt deck's parts, src/screens/you/ the You tab's
src/ui/                      Shared kit (Screen, Card, Pill, Button, BottomSheet, ScreenList…), surface tokens, toast, haptics, HintBubble
src/components/              Reusable pieces that aren't kit-level (DiscussionTips, carousel, ErrorBoundary)
src/hooks/                   Data hooks over the repositories (usePromptsForAge, useFavorites…)
src/db/                      SQLite open/migrate, numbered migrations, repositories, row types
src/sync/                    Cloud sync (outbox, record conversion, preference sync, change events)
src/providers/               The app-wide context providers: Theme, Db, ActiveContext, Auth
src/auth/                    Firebase / mock auth services and their types
src/backend/                 Firebase bootstrap, config from EXPO_PUBLIC_* env, Firestore model paths
src/data/                    Static config (age groups, feature flags, personalization tokens)
src/theme/                   Theme colors, shadows
src/utils/deviceHelpers.ts   Typography and Spacing scales (computed once; app is portrait-only, no tablets)
firebase/                    Firestore rules, indexes, and the rules test suite
content/                     The prompt library spreadsheet
.claude/skills/              Project skills for Claude Code (shared; settings.local.json stays personal)
```

`docs/` holds local working notes and is git-ignored; nothing in the repo should depend on it.

**Screens:**
- **Welcome / Welcome Tutorial** — first launch; continues the splash, then Get Started opens the Welcome guide (the swipeable tips deck), and finishing it opens the app on the deck's age pick. The guide can be replayed from the You tab; it opens from the root stack (`WelcomeGuide`), above the tabs, so it runs full screen with no tab bar, and finishing it lands on the Prompts tab.
- **Prompts** (`src/screens/prompt/`) — the deck: title card and age pick (skipped when a preferred age range is set), swipeable prompt cards with twists on the back, Listen (TTS), Tips, favorite, report; filters for age group and situation; deck source (originals vs My Prompts); Twist and Tips are hidden (not dimmed) for prompts without them; the deck does not wrap: after the last prompt an end card (`EndOfDeckCard`) offers another age group's deck or this one again, and dragging past it rubber-bands; a "How did that go?" reflection sheet is offered when a prompt that was on top for 45 s+ is swiped away
- **Explore / Module Detail** — themed modules and series (community posts are labeled samples until the community exists)
- **Create / Prompt Editor / Prompt Builder (`PromptBuilderScreen`, `PromptTemplatesRepo`; the table keeps its original name, `mad_libs_templates`) / My Prompts** — user-written prompts, playable in the deck
- **You** (`src/screens/you/`) — Profile and Settings merged into one tab: account, activity (sample numbers, labeled), Saved Prompts (the ♥ favorites for the active group, playable in the deck), personalization (child's name/town/interests, never synced), preferences, the community content filter (saved and synced, applied once the community opens), reflections, Welcome Guide / FAQ / I'm Concerned, the Professional upsell, account actions. There is no ⚙ in any header.
- **Signup flow** (`src/screens/signup/`) — email-link sign-in, profile (a display name and an "I'm 18 or older" confirmation; no username or birthdate), plan choice (kept for demos; free during beta)

**Quality gates:** `npm run typecheck` (strict TS), `npm run lint` (ESLint, expo config), `npm test` (Jest via `jest-expo`), `npm run test:rules` (Firestore rules against the emulator). All run in GitHub Actions (`.github/workflows/ci.yml`).

**Claude Code tooling (`.claude/` and `tools/`):** the session workflow lives in project skills, agents and hooks rather than in this file. Read the skill before doing the task by hand.
- Skills: `/run-app` (Metro in the background with a log, `tools/run-app.sh`), `/sim` (drive the simulator: tap, swipe, screenshot, light/dark, relaunch; `tools/sim/sim`), `/verify` (the whole gate in one run, `tools/check.sh`), `/ship` (commit style, PR body, checklist tick), `/checklist` (read and update the checklists without loading them whole), `/handoff` (write `docs/HANDOFF.md` at the end of a session).
- Agents: `ui-verifier` (screenshots stay in the agent; you get a text report — use it for every simulator check beyond a single screenshot), `design-critic`, `screen-restyler` (one per screen, in parallel), `release-checker`.
- Hooks (`.claude/settings.json`): `git commit` runs `tools/check.sh` and is blocked when it fails; hand-taken simulator screenshots are resized to 600 px and images over 800 px tall can't be read; `.bak` files beside source, deleting `.backups/` and force pushes are refused; SessionStart prints branch, open checklist counts, Metro/simulator state and the handoff note; compaction appends to `docs/HANDOFF.md`.
- Process: one feature branch per session, `/clear` after the PR merges; numbered requests go on the checklist and are done one at a time.

### Why cross-platform (React Native)
- Target users (parents, educators, therapists) use both iOS and Android roughly equally
- App is UI/content-focused — no heavy graphics or device-specific features
- Educators often use school-provided Android devices
- Professional tier needs to reach institutions on either platform

---

## Tiered Access Model

### Free Tier (Kids Safe Mode)
- 224 safe, positive prompts across all categories and age groups
- Core app functionality (browse, favorites, TTS)

### Premium Tier (Family Conversations)
- 44 additional real-world scenario prompts
- Requires parental consent gate
- Topics include peer pressure, honesty dilemmas, social media

### Professional Tier (Therapeutic)
- 22 sensitive-topic prompts designed for trained facilitators
- Topics: divorce, grief, bullying recovery, identity, family conflict, abuse, substance use
- Content reviewed for trauma sensitivity with professional guidance notes

**Professional Tier Features (in development):**
- Personalized prompt libraries (save, organize, tag, annotate)
- Session & progress tracking (which prompts used, engagement notes, usage history)
- Organization by individual, group, class, or caseload
- Community best practices (share discoveries, effectiveness ratings, curated collections)
- Privacy-first design (no student names/PII, anonymous labels like "Group A" or "Tuesday 3pm")
- Offline access / downloadable prompt packs
- Filter by topic, emotion, or therapeutic goal
- Standards alignment mapping (CASEL SEL, ASCA, NASW, trauma-informed care, IEP goals)
- Professional guidance notes per prompt

---

## Design Principles

1. **Dialogue facilitation over gamification** — No scoring, no voting, no "right answers." Focus on the thinking process.
2. **Mobile-first, distraction-free** — Clean interface that keeps the conversation front and center.
3. **Age-appropriate content first** — Content safety takes precedence over complexity.
4. **Brainstorming over judgment** — The phrasing "What are all the things you can think of..." is deliberate.
5. **Accessibility** — TTS support, large readable fonts, intuitive navigation.
6. **Privacy by design** — No PII stored, no HIPAA burden, anonymous organization for professional use.
7. **Scalable foundation** — Architecture supports future backend, community features, and professional tier expansion.

---

## Key Files Reference

- `content/Ethical_Choices_App_Full_Prompt_Library.xlsx` — Complete 290-prompt database with all metadata (age groups, categories, subcategories, tiers)
- `What_If_Professional_Tier_Discovery.docx` (not in the repo) — Professional tier discovery/feedback questionnaire for counselors, therapists, educators

---

## Development Guidelines

### When Building UI
- Use Inter for text and Geomini for headings: ExtraBold for page-level titles, Bold for card, sheet and section titles, SemiBold for prompt text, buttons and other display text (see Typography); no Barrio, Road Rage or Rock Salt
- Start from the shared kit in `src/ui/` and `useSurface()` for backgrounds, cards, borders and shadows, rather than raw theme colors
- Age groups keep their distinct assigned colors, shown as accents (dot, pill, stripe)
- Deep purple (`#49297e`, or `surface.accent`) for titles, icons and outlines
- Hot pink (`#e10086`) for primary CTAs and active states
- Check every screen in both light and dark mode, and the deck at the largest accessibility text size (the card height scales with the font scale, capped at 1.6×)
- Hide a control that has nothing to do (no twists, no tips) rather than dimming it; a dimmed button looks broken
- Bottom-anchored content on a tab screen adds `useTabBarInset()` to its bottom padding, or the floating tab bar covers it (`ScreenScroll` and `ScreenList` already do)
- The repo lives at `~/Developer/what-if` (moved out of iCloud Drive on 2026-10-20); keep it on a local path without spaces, or local native builds break. `npx expo run:ios` builds directly from here
- Welcome screen uses a soft gradient background, NOT the full color palette gradient
- The app icon (`tools/graphics/make_icon.py`) is the white hand-drawn mark on deep purple, filling ~80% of the tile; rerun the script after changing the mark

### When Working with Prompts
- Every prompt follows the format: "What if [scenario]? What are all the things you can think of that you could do?"
- Prompts are categorized by age group AND category AND subcategory AND tier
- Free tier prompts should be safe and positive; Premium adds real-world complexity; Professional addresses sensitive/therapeutic topics
- Subcategories are granular topic tags (228 unique values) — use them for filtering

### When Building Features
- Favorites and user data live in SQLite first and sync to Firestore through the outbox when signed in (`src/sync/`)
- Community features need quality control filtering (all / vetted / friends-only)
- Professional features must maintain anonymous organization (no student names ever)
- TTS uses `expo-speech` (see `src/screens/prompt/usePromptSpeech.ts`)

### Code Style
- React functional components with hooks
- Keep a screen file to one component plus its styles; split out pieces into a folder (as `src/screens/prompt/` does) once it passes a few hundred lines
- Memoize context values (`useMemo`) and handlers passed through context (`useCallback`); use `ScreenList` (FlatList) for anything that can grow without bound
- React Native `StyleSheet` for styling; colors from `useSurface()` / `useTheme()` applied inline
- Feather icons from `@expo/vector-icons`
- Backups taken before a refactor go in `.backups/` at the repo root (git-ignored), never next to the source; pair them with a git tag
