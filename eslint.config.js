// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // React Compiler rules, new in eslint-config-expo 58. The app doesn't use the
    // compiler, and they flag the usual Animated.Value-in-a-ref pattern. Turn them
    // back on if it adopts the compiler.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'ios/*',
      'android/*',
      'node_modules/*',
      // Local safety copies made before refactors (see CLAUDE.md).
      '**/*.bak',
      '.*-backup-*/**',
      'firestore-debug.log',
    ],
  },
]);
