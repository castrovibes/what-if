# Contributing to What Could You Do?

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, React Native version, device)

### Suggesting Features

Feature suggestions are welcome! Please:
- Check existing issues to avoid duplicates
- Provide a clear use case
- Explain how it benefits users
- Consider implementation complexity

### Pull Requests

1. **Fork the repository** and create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test thoroughly**
   - Test on iOS, Android, and Web (if applicable)
   - Ensure no regressions in existing features
   - Verify TypeScript compilation succeeds

4. **Commit your changes**
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots/videos for UI changes

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/castrovibes/what-if.git
   cd what-if
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start development server
   ```bash
   npm start
   ```

## Code Style

- Use **TypeScript** for type safety
- Follow **React hooks** best practices
- Use **functional components** (no class components)
- Keep components focused and single-purpose
- Use meaningful variable and function names
- Add comments for complex logic

## Adding New Prompts

Prompts are stored in the app's SQLite database and seeded by migrations in `src/db/migrations/`. The current seed data is placeholder content (flagged `is_placeholder = 1`); the real prompt library comes from the content team.

To add or replace prompts, write a new numbered migration (e.g. `0008_*.ts`) and register it in `src/db/migrations/index.ts`. Don't edit existing migrations — they have already run on installed devices. Prompts are read through `src/db/repositories/prompts.ts`.

### Prompt Guidelines

- Keep language age-appropriate
- Focus on everyday scenarios
- Encourage problem-solving
- Avoid violence or scary content
- Test with target age group when possible

## Project Conventions

### File Organization
- One screen per file in `src/screens/`
- Put reusable components in `src/components/`
- Place assets in `assets/` directory

### State Management
- Use React hooks (`useState`, `useEffect`)
- AsyncStorage for persistent data
- Keep state close to where it's used

### Styling
- Use StyleSheet.create() for styles
- Follow existing color palette
- Ensure responsive design
- Test on different screen sizes

## Questions?

Feel free to open an issue for any questions about contributing!

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best outcome for the project
- Help create a welcoming environment

Thank you for contributing! 🎉
