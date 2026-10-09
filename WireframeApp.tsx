/**
 * WireframeApp.tsx — App composition root.
 *
 * Layered providers, outer-to-inner:
 *   ThemeProvider             — palette + dark mode
 *   DbProvider                — opens SQLite, runs migrations (blocks UI until ready)
 *   ActiveContextProvider     — loads conversation contexts, exposes the active one
 *   RootNavigator             — fonts, first-launch logic, the stack
 *
 * Pre-refactor monolithic version preserved at git tag pre-refactor-2026-04-29.
 */

import React from 'react';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { DbProvider } from './src/providers/DbProvider';
import { ActiveContextProvider } from './src/providers/ActiveContextProvider';
import { RootNavigator } from './src/app/RootNavigator';

const WireframeApp = () => (
  <ThemeProvider>
    <DbProvider>
      <ActiveContextProvider>
        <RootNavigator />
      </ActiveContextProvider>
    </DbProvider>
  </ThemeProvider>
);

export default WireframeApp;
