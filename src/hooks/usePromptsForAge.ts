import { useEffect, useState } from 'react';
import { PromptRepo, PromptFilter } from '../db/repositories/prompts';
import { Prompt } from '../db/types';
import { AgeGroupId } from '../data/ageGroups';

export function usePromptsForAge(
  ageGroup: AgeGroupId,
  extra?: Omit<PromptFilter, 'ageGroup'>
): { prompts: Prompt[]; loading: boolean; error: Error | null } {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const liminalSpace = extra?.liminalSpace ?? null;
  const parentAskable = extra?.parentAskable ?? false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PromptRepo.findFiltered({
      ageGroup,
      liminalSpace: liminalSpace ?? undefined,
      parentAskable: parentAskable || undefined,
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
  }, [ageGroup, liminalSpace, parentAskable]);

  return { prompts, loading, error };
}
