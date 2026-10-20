# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The app was rebuilt in React Native for the TestFlight beta. Highlights:

### Added
- Swipeable prompt deck with twists, Tips, Listen (text-to-speech), favorites and reporting; an end-of-deck card and a "How did that go?" reflection sheet
- Explore tab with themed modules, Series, Community (labeled samples) and Articles
- Create tab: the prompt editor, the Prompt Builder and My Prompts, all playable in the deck
- You tab: account, Saved Prompts, personalization, preferences, community content filter, FAQ and I'm Concerned
- Welcome guide, one-time hints, a floating tab bar, toasts and haptics
- Optional sign-in with email links; local SQLite data that syncs to Firestore through an outbox
- Inter text and Geomini headings; the curved "What If?" launch art and app icon
- 200 placeholder prompts (50 per age group) until the content team's library is imported
- Typecheck, lint, unit tests and Firestore rules tests in CI; EAS build configuration

### Changed
- Replaced the earlier React web prototype; data moved from AsyncStorage to SQLite
- Barrio, Road Rage and Rock Salt fonts are no longer used

## [1.0.0] - 2026-02-10

The original web prototype, since replaced.

### Added
- Initial release of "What Could You Do?" app
- Age-appropriate prompts for 4 age groups (3-5, 6-8, 9-12, 13-15+ years)
- Welcome screen for first-time users
- Home screen with age group selection
- Interactive prompt display with navigation
- Favorites system for saving prompts
- Settings screen with customization options:
  - Dark mode toggle
  - Notification preferences
  - Text-to-speech option
  - Content filtering (vetted/community/all)
- Developer tools screen for testing
- Custom Barrio font integration
- Persistent storage using AsyncStorage
- Cross-platform support (iOS, Android, Web)
- Responsive design for different screen sizes
- Accessibility features

### Technical Stack
- React Native with Expo ~50.0.0
- TypeScript 5.1.3
- React 18.2.0
- AsyncStorage for data persistence
- Expo Font for custom typography
- Expo Vector Icons (Feather)
- Webpack support for web deployment
