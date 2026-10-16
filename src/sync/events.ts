/**
 * Tells screens to reload after sync replaced or cleared data underneath them.
 */
import { useEffect, useState } from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();

export const emitSyncChange = () => listeners.forEach(l => l());

/** A number that changes whenever synced data changes; add it to a loader's deps. */
export const useSyncVersion = (): number => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion(v => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return version;
};
