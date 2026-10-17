import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { runMigrations } from '../db';
import { LoadingScreen } from '../screens/LoadingScreen';
import { StartupErrorScreen } from '../screens/StartupErrorScreen';

/**
 * Opens the device database and brings it up to date before anything below reads
 * from it. A failed migration shows an error with a retry, since the app can't run
 * without its data.
 */
export const DbProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    runMigrations()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        console.error('DB migration failed:', err);
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt(n => n + 1);
  }, []);

  if (error) {
    return (
      <StartupErrorScreen
        title="Couldn’t open your data"
        message={
          __DEV__
            ? error.message
            : 'The app’s database couldn’t be opened. Try again; if it keeps happening, reinstalling the app will reset it.'
        }
        onRetry={retry}
      />
    );
  }

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
};
