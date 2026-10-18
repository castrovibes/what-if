import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (key: string) => `hint:${key}`;

/**
 * A hint that shows once per install (e.g. the first time Twist appears). `ready` is
 * true only once storage has been read and the hint hasn't been seen; `dismiss` marks
 * it seen for good. If storage can't be read the hint is treated as seen, so a storage
 * problem never nags.
 */
export const useOneTimeHint = (key: string) => {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey(key))
      .then(v => {
        if (!cancelled) setSeen(v === 'true');
      })
      .catch(() => {
        if (!cancelled) setSeen(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const dismiss = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(storageKey(key), 'true').catch(() => {});
  }, [key]);

  return { ready: seen === false, dismiss };
};
