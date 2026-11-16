import React from 'react';
import {
  BatteryCharging,
  Bookmark,
  Clock,
  Download,
  Globe,
  Home,
  Moon,
  Puzzle,
  Settings,
  Sun,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { AppRoute } from '../types/models';
import { OrbitalBrandMark } from './OrbitalBrandMark';

export const BrowserNavRail: React.FC = () => {
  const {
    route,
    navigate,
    tabs,
    activeDownloadsCount,
    enabledExtensionCount,
    resolvedTheme,
    isBatterySaverActive,
    updateSettings,
    t,
  } = useApp();

  const items: Array<{
    id: AppRoute;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeTone?: 'violet' | 'cyan' | 'gold';
  }> = [
    {
      id: 'home',
      label: t('home'),
      icon: <Home className="h-[19px] w-[19px]" />,
    },
    {
      id: 'browser',
      label: t('browser_title'),
      icon: <Globe className="h-[19px] w-[19px]" />,
      badge: tabs.length > 1 ? tabs.length : undefined,
      badgeTone: 'cyan',
    },
    {
      id: 'downloads',
      label: t('downloads'),
      icon: <Download className="h-[19px] w-[19px]" />,
      badge: activeDownloadsCount > 0 ? activeDownloadsCount : undefined,
      badgeTone: 'gold',
    },
    {
      id: 'bookmarks',
      label: t('bookmarks'),
      icon: <Bookmark className="h-[19px] w-[19px]" />,
    },
    {
      id: 'history',
      label: t('history'),
      icon: <Clock className="h-[19px] w-[19px]" />,
    },
    {
      id: 'extensions',
      label: t('extensions'),
      icon: <Puzzle className="h-[19px] w-[19px]" />,
      badge: enabledExtensionCount > 0 ? enabledExtensionCount : undefined,
      badgeTone: 'violet',
    },
  ];

  const toggleQuickTheme = () => {
    updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <aside
      aria-label={t('app_name')}
      className="z-30 hidden w-[68px] shrink-0 flex-col items-center justify-between border-e border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] py-3.5 md:flex"
    >
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('home')}
          title={t('app_name')}
          aria-label={t('home')}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105"
        >
          <OrbitalBrandMark size={38} />
        </button>

        <div className="h-px w-7 bg-[var(--salvia-border)]" />

        <nav className="flex flex-col items-center gap-2">
          {items.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-150 ${
                  active
                    ? 'bg-[var(--salvia-elevated)] text-[var(--salvia-text)] ring-1 ring-[var(--salvia-iris)]/70 shadow-[0_0_16px_rgba(143,107,255,0.2)]'
                    : 'text-[var(--salvia-text-subtle)] hover:bg-[var(--salvia-surface)] hover:text-[var(--salvia-text)]'
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2.5 start-0 w-[3px] rounded-full bg-gradient-to-b from-[#4CC4FF] to-[#8F6BFF]"
                  />
                ) : null}
                {item.icon}
                {item.badge ? (
                  <span
                    className={`font-data absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      item.badgeTone === 'cyan'
                        ? 'bg-[#4CC4FF] text-[#000000]'
                        : item.badgeTone === 'gold'
                          ? 'bg-[#D9AE54] text-[#000000]'
                          : 'bg-[var(--salvia-iris)] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2">
        {isBatterySaverActive ? (
          <button
            type="button"
            onClick={() => navigate('settings')}
            title={t('battery_active_badge')}
            aria-label={t('battery_active_badge')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-cyan-container)] text-[var(--salvia-cyan-text)] ring-1 ring-[var(--salvia-cyan)]/40"
          >
            <BatteryCharging className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={toggleQuickTheme}
          title={resolvedTheme === 'dark' ? t('theme_light') : t('theme_dark')}
          aria-label={resolvedTheme === 'dark' ? t('theme_light') : t('theme_dark')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[var(--salvia-text-subtle)] transition-colors hover:bg-[var(--salvia-surface)] hover:text-[var(--salvia-gold)]"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('settings')}
          title={t('settings')}
          aria-label={t('settings')}
          aria-current={route === 'settings' ? 'page' : undefined}
          className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-150 ${
            route === 'settings'
              ? 'bg-[var(--salvia-elevated)] text-[var(--salvia-text)] ring-1 ring-[var(--salvia-iris)]/70'
              : 'text-[var(--salvia-text-subtle)] hover:bg-[var(--salvia-surface)] hover:text-[var(--salvia-text)]'
          }`}
        >
          <Settings className="h-[19px] w-[19px]" />
        </button>
      </div>
    </aside>
  );
};
