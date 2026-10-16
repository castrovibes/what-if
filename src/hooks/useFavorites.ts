import { useCallback, useEffect, useState } from 'react';
import { FavoritesRepo } from '../db/repositories/favorites';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { useSyncVersion } from '../sync/events';

export function useFavorites(): {
  favorites: Set<string>;
  isFavorited: (promptId: string) => boolean;
  toggle: (promptId: string) => Promise<void>;
} {
  const { activeContext } = useActiveContext();
  const contextId = activeContext.id;
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const syncVersion = useSyncVersion();

  useEffect(() => {
    let cancelled = false;
    FavoritesRepo.listForContext(contextId).then(ids => {
      if (!cancelled) setFavorites(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [contextId, syncVersion]);

  const toggle = useCallback(
    async (promptId: string) => {
      if (favorites.has(promptId)) {
        await FavoritesRepo.remove(contextId, promptId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(promptId);
          return next;
        });
      } else {
        await FavoritesRepo.add(contextId, promptId);
        setFavorites(prev => new Set(prev).add(promptId));
      }
    },
    [contextId, favorites]
  );

  const isFavorited = useCallback((promptId: string) => favorites.has(promptId), [favorites]);

  return { favorites, isFavorited, toggle };
}
