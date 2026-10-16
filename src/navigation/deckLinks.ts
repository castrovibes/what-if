import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { AgeGroupId } from '../data/ageGroups';

/**
 * Opens the Prompts tab with the deck showing My Prompts for an age group, from
 * anywhere in the tab navigator (e.g. right after creating a prompt). `opened` makes
 * each request distinct, so the deck reloads even if it was already on My Prompts.
 */
export const playMyPromptsInDeck = (
  navigation: NavigationProp<ParamListBase>,
  ageGroup: AgeGroupId,
) => {
  const tabs = navigation.getParent() ?? navigation;
  tabs.navigate('Prompts', {
    screen: 'PromptsMain',
    params: { source: 'user', ageGroup, opened: Date.now() },
  });
};
