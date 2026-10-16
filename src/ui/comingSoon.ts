import { Alert } from 'react-native';

/**
 * Feedback for controls that aren't built yet, so beta testers know it's expected
 * rather than reporting a broken button.
 */
export const comingSoon = (feature: string) =>
  Alert.alert('Coming soon', `${feature} isn't available in this beta yet.`);
