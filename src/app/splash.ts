import * as SplashScreen from 'expo-splash-screen';

// The native launch screen stays up until the app has drawn its first frame (the
// LoadingScreen, which shows the same image), so there's no blank gap in between.
SplashScreen.preventAutoHideAsync().catch(() => {});

let hidden = false;

/** Lets the native launch screen go. Safe to call more than once. */
export const hideSplash = () => {
  if (hidden) return;
  hidden = true;
  SplashScreen.hideAsync().catch(() => {});
};

// Never leave someone stuck on the launch screen if something goes wrong.
setTimeout(hideSplash, 6000);
