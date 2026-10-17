import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { AgeGroupId } from '../data/ageGroups';

/** What to show when sending someone to the Prompts deck from elsewhere. */
export type DeckRequest = {
  source: 'official' | 'user';
  ageGroup: AgeGroupId;
  /** Put this prompt on top of the deck. */
  promptId?: string;
};

// The Prompts screen registers a handler that sets the deck up and resolves once it's
// ready (face up, loaded, the right prompt on top), so we can switch to it fully drawn.
type DeckHandler = (request: DeckRequest) => Promise<void>;
let deckHandler: DeckHandler | null = null;

export const registerDeckHandler = (handler: DeckHandler) => {
  deckHandler = handler;
  return () => {
    if (deckHandler === handler) deckHandler = null;
  };
};

// Never keep someone waiting long on a slow load, and give a just-tapped alert time to
// fade before the screen changes.
const MAX_WAIT_MS = 1500;
const MIN_WAIT_MS = 250;
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Opens the Prompts tab with the deck showing My Prompts for an age group (with
 * `promptId` on top), from anywhere in the tab navigator, e.g. right after writing a
 * prompt. The deck is set up out of sight first, and the tab switches once it's ready,
 * so there's no flip or reload on screen. Resolves after the switch.
 */
export const playMyPromptsInDeck = async (
  navigation: NavigationProp<ParamListBase>,
  ageGroup: AgeGroupId,
  promptId?: string,
) => {
  const tabs = navigation.getParent() ?? navigation;
  const request: DeckRequest = { source: 'user', ageGroup, promptId };
  if (deckHandler) {
    await Promise.all([Promise.race([deckHandler(request), wait(MAX_WAIT_MS)]), wait(MIN_WAIT_MS)]);
    tabs.navigate('Prompts', { screen: 'PromptsMain' });
    return;
  }
  // The Prompts screen hasn't been opened yet: hand it the request as route params.
  tabs.navigate('Prompts', {
    screen: 'PromptsMain',
    params: { ...request, opened: Date.now() },
  });
};
