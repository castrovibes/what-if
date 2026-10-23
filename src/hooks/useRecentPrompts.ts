import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PromptPlayRepo, PlayedPrompt } from '../db/repositories/promptPlays';
import { applyTokens } from '../data/personalizationTokens';
import { usePersonalization } from './usePersonalization';

/**
 * The prompts most recently played in the deck (newest first, up to `limit`), for the
 * note editor's prompt menu; null until loaded. `text` is personalized for the active
 * group, as the deck shows it. Reloads on focus.
 */
export function useRecentPrompts(limit = 10): {
  prompts: PlayedPrompt[] | null;
  refresh: () => Promise<void>;
} {
  const personalization = usePersonalization();
  const [raw, setRaw] = useState<PlayedPrompt[] | null>(null);

  const refresh = useCallback(async () => {
    setRaw(await PromptPlayRepo.listRecent(limit));
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Personalization loads separately, so apply it here rather than in the query.
  const prompts = useMemo(
    () => raw?.map(p => ({ ...p, text: applyTokens(p.rawText, personalization) })) ?? null,
    [raw, personalization],
  );

  return { prompts, refresh };
}
