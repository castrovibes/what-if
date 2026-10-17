import { useEffect, useState } from 'react';
import { PromptRepo, PromptFilter } from '../db/repositories/prompts';
import { Prompt } from '../db/types';
import { AgeGroupId } from '../data/ageGroups';

export function usePromptsForAge(
  ageGroup: AgeGroupId,
  extra?: Omit<PromptFilter, 'ageGroup'> & {
    /** Change it to load again (e.g. after the user adds a prompt). */
    reloadKey?: number;
  }
): { prompts: Prompt[]; loading: boolean; error: Error | null } {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const liminalSpace = extra?.liminalSpace ?? null;
  const parentAskable = extra?.parentAskable ?? false;
  const source = extra?.source;
  const reloadKey = extra?.reloadKey ?? 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PromptRepo.findFiltered({
      ageGroup,
      liminalSpace: liminalSpace ?? undefined,
      parentAskable: parentAskable || undefined,
      source,
    })
      .then(rows => {
        if (cancelled) return;
        setPrompts(rows);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ageGroup, liminalSpace, parentAskable, source, reloadKey]);

  return { prompts, loading, error };
}
