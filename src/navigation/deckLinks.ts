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

// The tab navigator, found by its routes rather than a fixed number of getParent() steps:
// callers pass either a screen in a tab's stack or (after closing that screen) the tab
// itself, and React Navigation 7 no longer passes an unhandled action down to children.
const findTabs = (navigation: NavigationProp<ParamListBase>) => {
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  while (nav && !nav.getState()?.routeNames.includes('Prompts')) nav = nav.getParent();
  return nav ?? navigation;
};

/**
 * Opens the Prompts tab with the deck showing `request` (a source and age group, with
 * `promptId` on top), from anywhere in the tab navigator. The deck is set up out of
 * sight first, and the tab switches once it's ready, so there's no flip or reload on
 * screen. Resolves after the switch.
 */
export const playInDeck = async (navigation: NavigationProp<ParamListBase>, request: DeckRequest) => {
  const tabs = findTabs(navigation);
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

/** `playInDeck` for My Prompts, e.g. right after writing a prompt or ▶ in the list. */
export const playMyPromptsInDeck = (
  navigation: NavigationProp<ParamListBase>,
  ageGroup: AgeGroupId,
  promptId?: string,
) => playInDeck(navigation, { source: 'user', ageGroup, promptId });
