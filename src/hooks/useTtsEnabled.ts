import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The Settings > Text-to-Speech switch: whether prompts can be read aloud (the Listen
 * button). Saved on the device; shared by every screen that uses it.
 */
const STORAGE_KEY = 'ttsEnabled';

let current = true;
let loaded = false;
const listeners = new Set<(value: boolean) => void>();

const load = AsyncStorage.getItem(STORAGE_KEY).then(v => {
  current = v !== 'false';
  loaded = true;
  listeners.forEach(l => l(current));
});

export const useTtsEnabled = (): [boolean, (value: boolean) => void] => {
  const [enabled, setEnabled] = useState(current);

  useEffect(() => {
    listeners.add(setEnabled);
    if (loaded) setEnabled(current);
    else load.then(() => setEnabled(current));
    return () => {
      listeners.delete(setEnabled);
    };
  }, []);

  const set = (value: boolean) => {
    current = value;
    AsyncStorage.setItem(STORAGE_KEY, String(value));
    listeners.forEach(l => l(value));
  };

  return [enabled, set];
};
