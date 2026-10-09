/**
 * Metro Bundler Configuration
 *
 * Metro is the JavaScript bundler for React Native. This configuration
 * customizes Metro's behavior for optimal performance when working with
 * files stored in iCloud Drive.
 *
 * Key optimizations:
 * - Restricted file watching to project directory only
 * - Limited worker threads to reduce system resource usage
 *
 * @see https://docs.expo.dev/guides/customizing-metro/
 */

const { getDefaultConfig } = require('expo/metro-config');

// Start with Expo's default Metro configuration
const config = getDefaultConfig(__dirname);

/**
 * Restrict file watching to project directory
 *
 * When working with iCloud Drive, watching too many folders can cause
 * performance issues. This limits watching to only the current project directory.
 */
config.watchFolders = [__dirname];

/**
 * Limit concurrent workers
 *
 * Reduces the number of parallel bundling workers from the default to 2.
 * This helps prevent resource exhaustion when working with cloud-synced files.
 */
config.maxWorkers = 2;

module.exports = config;
