import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContextRepo } from '../db/repositories/contexts';
import { Context as ConversationContext } from '../db/types';
import { AgeGroupId } from '../data/ageGroups';
import { LoadingScreen } from '../screens/LoadingScreen';
import { StartupErrorScreen } from '../screens/StartupErrorScreen';
import { useSyncVersion } from '../sync/events';
import { PreferenceSync } from '../sync/preferenceSync';

export const ACTIVE_CONTEXT_KEY = 'activeContextId';

type ActiveContextValue = {
  activeContext: ConversationContext;
  contexts: ConversationContext[];
  switchContext: (id: string) => Promise<void>;
  /** Preferred age range for the active context; null means "ask each session". */
  setPreferredAgeGroup: (ageGroup: AgeGroupId | null) => Promise<void>;
};

const ActiveContextCtx = createContext<ActiveContextValue | null>(null);

export const useActiveContext = (): ActiveContextValue => {
  const value = useContext(ActiveContextCtx);
  if (!value) throw new Error('useActiveContext must be used inside ActiveContextProvider');
  return value;
};

export const ActiveContextProvider = ({ children }: { children: ReactNode }) => {
  const [contexts, setContexts] = useState<ConversationContext[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Reload when sync pulls contexts from the cloud or clears them on sign-out.
  const syncVersion = useSyncVersion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await ContextRepo.list();
      if (all.length === 0) {
        // Migration 0001 seeds Quick Start; an empty table means the database is in a
        // state we don't understand, so stop here rather than crash somewhere deeper.
        throw new Error('No conversation contexts found. The database may not have been seeded.');
      }
      const stored = await AsyncStorage.getItem(ACTIVE_CONTEXT_KEY);
      const valid = stored && all.some(c => c.id === stored) ? stored : all[0].id;
      if (stored !== valid) await AsyncStorage.setItem(ACTIVE_CONTEXT_KEY, valid);
      if (cancelled) return;
      setContexts(all);
      setActiveId(valid);
    })().catch((err: unknown) => {
      console.error('Loading contexts failed:', err);
      if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
    });
    return () => {
      cancelled = true;
    };
  }, [syncVersion, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt(n => n + 1);
  }, []);

  const switchContext = useCallback(
    async (id: string) => {
      if (!contexts?.some(c => c.id === id)) {
        throw new Error(`Unknown context id: ${id}`);
      }
      await AsyncStorage.setItem(ACTIVE_CONTEXT_KEY, id);
      setActiveId(id);
      PreferenceSync.push({ activeContextId: id });
    },
    [contexts],
  );

  const setPreferredAgeGroup = useCallback(
    async (ageGroup: AgeGroupId | null) => {
      if (!activeId) return;
      await ContextRepo.setAgeGroupDefault(activeId, ageGroup);
      setContexts(prev =>
        prev ? prev.map(c => (c.id === activeId ? { ...c, ageGroupDefault: ageGroup } : c)) : prev,
      );
    },
    [activeId],
  );

  const activeContext = useMemo(
    () => contexts?.find(c => c.id === activeId) ?? null,
    [contexts, activeId],
  );
  // Memoized so consumers only re-render when the contexts or the active one change.
  const value = useMemo<ActiveContextValue | null>(
    () =>
      contexts && activeContext
        ? { activeContext, contexts, switchContext, setPreferredAgeGroup }
        : null,
    [contexts, activeContext, switchContext, setPreferredAgeGroup],
  );

  if (error) {
    return (
      <StartupErrorScreen
        title="Couldn’t load your settings"
        message={
          __DEV__
            ? error.message
            : 'Your conversation settings couldn’t be loaded. Try again; if it keeps happening, reinstalling the app will reset it.'
        }
        onRetry={retry}
      />
    );
  }

  if (!value) return <LoadingScreen />;

  return <ActiveContextCtx.Provider value={value}>{children}</ActiveContextCtx.Provider>;
};
