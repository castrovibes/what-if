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
- **Inter** for everything (bundled in `assets/fonts/`, all three from the same release: `@expo-google-fonts/inter` 0.4.1, OFL-1.1). Loaded in `src/app/RootNavigator.tsx`:
  - `Inter-SemiBold` — screen titles (accent purple, title case — not all caps), card titles, prompt text, buttons
  - `Inter-Medium` — body text, labels, descriptions, navigation
  - `Inter-MediumItalic` — the follow-up question on prompt cards ("What are all the things you can think of…"). Use this family rather than `fontStyle: 'italic'`, which iOS ignores for custom fonts.
- **Rock Salt** (`assets/fonts/RockSalt-Regular.ttf`, `@expo-google-fonts/rock-salt` 0.4.1, Apache-2.0) — the hand-lettered "What If?" on the launch screen only. It's drawn into the launch images (`tools/graphics/make_splash.py`), which the iOS splash and the in-app `LoadingScreen` both show, so the app doesn't load it at runtime.
- Barrio and Road Rage are no longer used or loaded (the font files remain in `assets/fonts/`).

### Visual language (set by the prompt card screen)
- Soft gray screen background (light) / near-black (dark); content sits on white rounded cards (radius 20, hairline border, soft shadow). Dark mode uses lighter raised cards and heavier shadows for contrast.
- Hot pink for primary actions and active/selected states; deep purple (lightened in dark mode) for titles, icons and outlines.
- Age-group colors are accents only — a dot, small pill or thin stripe — never full card backgrounds.
- Filters are pills; secondary choices open bottom sheets.
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
There are 228 unique subcategories spanning topics from `sharing` and `empathy` to `cyberbullying`, `grief`, `identity`, `peer pressure`, `substance experimentation`, and `sexual boundaries`. See `Ethical_Choices_App_Full_Prompt_Library.xlsx` for the complete mapping.

---

## App Architecture & Features

### Current Prototype (React Web)
The current wireframe prototype is built in React with these screens and features:

**Screens:**
1. **Welcome** — Splash with "What Could You Do?" branding, gradient background (indigo-50 → purple-50 → pink-50), large background "?" watermark
2. **Welcome Tutorial** — swipeable card deck of tips for meaningful conversations
3. **Home** — Age group selection grid (4 colored buttons), "Ready to explore?" prompt, resume last session
4. **Age Selection** — Grid view of all age groups with prompt counts
5. **Prompt Display** — Full-screen prompt text, Read Aloud (TTS), Save/Favorite, prompt counter (X of Y), Discussion Tips, Next Prompt navigation
6. **Community** — Browse/share prompts, filter tabs (All, Favorites, My Submissions), user cards with roles
7. **Profile** — Activity stats, recent conversations, milestones, favorite prompts, quality/safety settings
8. **Settings** — Account, preferences, content filters, support info
9. **Submit Prompt** — User-generated prompt submission form

**Implemented Features:**
- Favorites system with local storage persistence
- Text-to-speech accessibility (browser Speech Synthesis API)
- User prompt submission form (ready for backend integration)
- Community sharing with quality control settings (3 filter levels: all content, vetted content, friends-only)
- Comprehensive onboarding flow
- Activity tracking in profile
- Bottom tab navigation (Home, Community, Profile, Settings)

### Recommended Production Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| UI Components | React Native Paper or NativeBase |
| Navigation | React Navigation |
| Backend | Firebase or Supabase |
| Database | Firestore or PostgreSQL |
| Auth | Firebase Auth or Auth0 |
| Hosting | Vercel (web) + App Stores |

Cross-platform (React Native) was chosen because:
- Target users (parents, educators, therapists) use both iOS and Android roughly equally
- App is UI/content-focused — no heavy graphics or device-specific features
- React prototype can inform React Native development directly
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

- `Ethical_Choices_App_Full_Prompt_Library.xlsx` — Complete 290-prompt database with all metadata (age groups, categories, subcategories, tiers)
- `What_If_Professional_Tier_Discovery.docx` — Professional tier discovery/feedback questionnaire for counselors, therapists, educators

---

## Development Guidelines

### When Building UI
- Use Inter for all text (see Typography); no Barrio or Road Rage
- Start from the shared kit in `src/ui/` and `useSurface()` for backgrounds, cards, borders and shadows, rather than raw theme colors
- Age groups keep their distinct assigned colors, shown as accents (dot, pill, stripe)
- Deep purple (`#49297e`, or `surface.accent`) for titles, icons and outlines
- Hot pink (`#e10086`) for primary CTAs and active states
- Check every screen in both light and dark mode
- Welcome screen uses a soft gradient background, NOT the full color palette gradient

### When Working with Prompts
- Every prompt follows the format: "What if [scenario]? What are all the things you can think of that you could do?"
- Prompts are categorized by age group AND category AND subcategory AND tier
- Free tier prompts should be safe and positive; Premium adds real-world complexity; Professional addresses sensitive/therapeutic topics
- Subcategories are granular topic tags (228 unique values) — use them for filtering

### When Building Features
- No localStorage in Claude.ai artifacts (use React state or in-memory storage)
- Favorites and user data should persist via backend when available, fall back to device storage
- Community features need quality control filtering (all / vetted / friends-only)
- Professional features must maintain anonymous organization (no student names ever)
- TTS uses browser Speech Synthesis API

### Code Style
- React functional components with hooks
- Single-file components preferred for prototyping
- React Native `StyleSheet` for styling; colors from `useSurface()` / `useTheme()` applied inline
- Feather icons from `@expo/vector-icons`
