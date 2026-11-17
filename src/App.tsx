/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-only
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppSplashOverlay } from './components/AppSplashOverlay';
import { getSalviaNative } from './core/nativeBridge';
import { HomeScreen } from './screens/HomeScreen';
import { AppProvider, useApp } from './store/AppContext';

const BrowserScreen = lazy(() =>
  import('./screens/BrowserScreen').then((m) => ({ default: m.BrowserScreen }))
);
const DownloadsScreen = lazy(() =>
  import('./screens/DownloadsScreen').then((m) => ({ default: m.DownloadsScreen }))
);
const BookmarksScreen = lazy(() =>
  import('./screens/BookmarksScreen').then((m) => ({ default: m.BookmarksScreen }))
);
const HistoryScreen = lazy(() =>
  import('./screens/HistoryScreen').then((m) => ({ default: m.HistoryScreen }))
);
const ExtensionsScreen = lazy(() =>
  import('./screens/ExtensionsScreen').then((m) => ({ default: m.ExtensionsScreen }))
);
const SettingsScreen = lazy(() =>
  import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen }))
);
const MediaPlayerScreen = lazy(() =>
  import('./screens/MediaPlayerScreen').then((m) => ({ default: m.MediaPlayerScreen }))
);
const TabSwitcher = lazy(() =>
  import('./components/TabSwitcher').then((m) => ({ default: m.TabSwitcher }))
);
const MediaTraySheet = lazy(() =>
  import('./components/MediaTraySheet').then((m) => ({ default: m.MediaTraySheet }))
);
const MediaQualitySelectionSheet = lazy(() =>
  import('./components/MediaQualitySelectionSheet').then((m) => ({
    default: m.MediaQualitySelectionSheet,
  }))
);

const SalviaShell: React.FC = () => {
  const {
    route,
    toastMessage,
    isTabSwitcherVisible,
    isMediaTrayVisible,
    qualitySheet,
  } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (route !== 'browser') {
      getSalviaNative()?.setBrowserViewport?.(false, 0, 0, 0, 0);
    }
  }, [route]);

  useEffect(() => {
    const win = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const prefetch = () => {
      void import('./screens/BrowserScreen');
      void import('./components/TabSwitcher');
      void import('./components/MediaTraySheet');
      void import('./components/MediaQualitySelectionSheet');
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetch, 600);
    return () => window.clearTimeout(timer);
  }, []);

  const renderScreen = () => {
    switch (route) {
      case 'browser':
        return <BrowserScreen />;
      case 'downloads':
        return <DownloadsScreen />;
      case 'bookmarks':
        return <BookmarksScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'extensions':
        return <ExtensionsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'player':
        return <MediaPlayerScreen />;
      case 'home':
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-[var(--salvia-bg)]" />}>
        {renderScreen()}
      </Suspense>
      <Suspense fallback={null}>
        {isTabSwitcherVisible ? <TabSwitcher /> : null}
        {isMediaTrayVisible ? <MediaTraySheet /> : null}
        {qualitySheet ? <MediaQualitySelectionSheet /> : null}
      </Suspense>
      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="animate-salvia-menu-in pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-[var(--salvia-iris)]/70 bg-[var(--salvia-elevated)]/95 px-4 py-2.5 text-[13px] font-medium text-[var(--salvia-text)] shadow-2xl backdrop-blur-md"
        >
          {toastMessage}
        </div>
      ) : null}
      {!splashDone ? <AppSplashOverlay onFinished={() => setSplashDone(true)} /> : null}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <SalviaShell />
    </AppProvider>
  );
};

export default App;
