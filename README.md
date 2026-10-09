# What Could You Do? 🤔

A React Native mobile application designed to foster meaningful conversations with children through age-appropriate "What if?" scenario prompts. This interactive app helps develop problem-solving skills, emotional intelligence, and critical thinking in young minds.

## 📱 About

**What Could You Do?** presents children with thoughtful scenarios and encourages them to think through solutions. The app provides age-appropriate prompts across different developmental stages, making it perfect for parents, educators, and caregivers to engage children in constructive dialogue.

### Key Features

- 🎯 **Age-Appropriate Content**: Tailored prompts for 4 age groups (3-5, 6-8, 9-12, 13-15+ years)
- ⭐ **Favorites System**: Save and revisit favorite prompts
- 🎨 **Custom Typography**: Engaging Barrio font for a playful experience
- 🌙 **Dark Mode Support**: Eye-friendly viewing in any lighting
- 🔔 **Smart Notifications**: Optional daily conversation starters
- 🎤 **Text-to-Speech**: Accessibility feature for younger children
- 🛡️ **Content Filtering**: Vetted prompts ensure age-appropriate content
- 💾 **Persistent State**: Remembers user preferences and favorites
- 📱 **Cross-Platform**: Works on iOS, Android, and Web

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Expo CLI** (installed automatically with dependencies)
- Optional: **Xcode** (for iOS development) or **Android Studio** (for Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/castrovibes/what-if.git
   cd what-if
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

### Running the App

After running `npm start`, you'll see options in the terminal:

- **Press `w`** - Open in web browser (http://localhost:8081)
- **Press `i`** - Open in iOS Simulator (requires macOS with Xcode)
- **Press `a`** - Open in Android Emulator (requires Android Studio)
- **Scan QR code** - Use Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) on your phone

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run web` | Run the app in web browser |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |

## 🏗️ Project Structure

```
what-if/
├── App.tsx                     # Application entry point
├── WireframeApp.tsx           # Main app component with all screens
├── assets/
│   └── fonts/
│       └── Barrio-Regular.ttf # Custom display font
├── package.json               # Project dependencies
├── app.json                   # Expo configuration
├── tsconfig.json             # TypeScript configuration
├── babel.config.js           # Babel configuration
└── metro.config.js           # Metro bundler config (native + web)
```

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Storage**: AsyncStorage for persistent data
- **Icons**: Expo Vector Icons (Feather)
- **Fonts**: Expo Font with custom Barrio typeface
- **Web Support**: Expo Web (Metro)
- **Development**: Hot reloading, TypeScript checking

## 🎨 App Screens

1. **Welcome Screen**: First-time user onboarding
2. **Home Screen**: Main navigation with age group selection
3. **Prompt Screen**: Interactive scenario presentation
4. **Favorites**: Saved prompts for quick access
5. **Settings**: Customize app behavior and preferences
6. **Developer Tools**: Testing and development utilities

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- The app supports hot reloading - changes appear automatically
- Edit `WireframeApp.tsx` to modify app screens and logic
- Styles use React Native's StyleSheet API
- Follow TypeScript best practices
- Test on multiple platforms before submitting PRs

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

**Scott Arakawa** - [Digital Ninja](mailto:scott@digitalninja.com)
- GitHub: [@castrovibes](https://github.com/castrovibes)

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons by [Feather Icons](https://feathericons.com/)
- Font: [Barrio](https://fonts.google.com/specimen/Barrio) by Google Fonts

---

Made with ❤️ to inspire thoughtful conversations with children
