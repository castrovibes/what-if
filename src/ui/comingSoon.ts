import { toast } from './toast';

/**
 * Feedback for controls that aren't built yet, so beta testers know it's expected
 * rather than reporting a broken button. An in-app toast, not a system alert.
 */
export const comingSoon = (feature: string) => toast.beta(feature);
