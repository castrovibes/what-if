import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityFilter } from '../backend/model';
import { PreferenceSync } from '../sync/preferenceSync';

/**
 * You > Community > Quality & safety: which shared prompts may appear once the
 * community opens. Saved on the device and, when signed in, on the account
 * (users/{uid}.preferences.communityFilter), like dark mode.
 *
 * `null` means never chosen; the effective value is then the recommended one.
 */
const STORAGE_KEY = 'communityFilter';
export const DEFAULT_COMMUNITY_FILTER: CommunityFilter = 'vetted';
const VALUES: CommunityFilter[] = ['all', 'vetted', 'friends'];

const isFilter = (v: unknown): v is CommunityFilter => VALUES.includes(v as CommunityFilter);

let choice: CommunityFilter | null = null;
let loaded = false;
const listeners = new Set<(value: CommunityFilter) => void>();

const effective = () => choice ?? DEFAULT_COMMUNITY_FILTER;
const notify = () => listeners.forEach(l => l(effective()));

const load = AsyncStorage.getItem(STORAGE_KEY).then(v => {
  if (isFilter(v)) choice = v;
  loaded = true;
  notify();
});

const store = (value: CommunityFilter | null) => {
  choice = value;
  if (value) AsyncStorage.setItem(STORAGE_KEY, value);
  else AsyncStorage.removeItem(STORAGE_KEY);
  notify();
};

export const CommunityFilterStore = {
  /** The explicit choice on this device, or null when none was made yet. */
  get: (): CommunityFilter | null => choice,
  /** Resolves once the saved choice has been read. */
  ready: (): Promise<void> => load,
  /** Saves a choice made here and syncs it to the account. */
  set(value: CommunityFilter) {
    store(value);
    PreferenceSync.push({ communityFilter: value });
  },
  /** Applies the account's saved choice without syncing it back. */
  apply(value: CommunityFilter | null) {
    store(value);
  },
};

export const useCommunityFilter = (): [CommunityFilter, (value: CommunityFilter) => void] => {
  const [value, setValue] = useState<CommunityFilter>(effective());

  useEffect(() => {
    listeners.add(setValue);
    if (loaded) setValue(effective());
    else load.then(() => setValue(effective()));
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return [value, CommunityFilterStore.set];
};
