import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContextRepo } from '../db/repositories/contexts';
import { Context as ConversationContext } from '../db/types';
import { AgeGroupId } from '../data/ageGroups';
import { LoadingScreen } from '../screens/LoadingScreen';
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
  // Reload when sync pulls contexts from the cloud or clears them on sign-out.
  const syncVersion = useSyncVersion();

  useEffect(() => {
    (async () => {
      const all = await ContextRepo.list();
      if (all.length === 0) {
        // Migration is supposed to seed Quick Start; if we got here something is wrong.
        // Fail loudly in dev so we notice.
        throw new Error('No contexts found. Migration may not have seeded the default.');
      }
      const stored = await AsyncStorage.getItem(ACTIVE_CONTEXT_KEY);
      const valid = stored && all.some(c => c.id === stored) ? stored : all[0].id;
      if (stored !== valid) await AsyncStorage.setItem(ACTIVE_CONTEXT_KEY, valid);
      setContexts(all);
      setActiveId(valid);
    })();
  }, [syncVersion]);

  const switchContext = async (id: string) => {
    if (!contexts?.some(c => c.id === id)) {
      throw new Error(`Unknown context id: ${id}`);
    }
    await AsyncStorage.setItem(ACTIVE_CONTEXT_KEY, id);
    setActiveId(id);
    PreferenceSync.push({ activeContextId: id });
  };

  const setPreferredAgeGroup = async (ageGroup: AgeGroupId | null) => {
    if (!activeId) return;
    await ContextRepo.setAgeGroupDefault(activeId, ageGroup);
    setContexts(prev =>
      prev ? prev.map(c => (c.id === activeId ? { ...c, ageGroupDefault: ageGroup } : c)) : prev,
    );
  };

  if (!contexts || !activeId) return <LoadingScreen />;
  const activeContext = contexts.find(c => c.id === activeId);
  if (!activeContext) return <LoadingScreen />;

  return (
    <ActiveContextCtx.Provider value={{ activeContext, contexts, switchContext, setPreferredAgeGroup }}>
      {children}
    </ActiveContextCtx.Provider>
  );
};
