import React, { useEffect } from 'react';
import {
  ArrowDownUp,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  Eraser,
  History,
  Lock,
  Monitor,
  Moon,
  Pin,
  Plus,
  Puzzle,
  Radar,
  Search,
  Settings,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { isUrlPinned } from '../core/speedDial';
import { useApp } from '../store/AppContext';

interface BrowserMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDeepScan: () => void;
  onCopyUrl: () => void;
  onSharePage: () => void;
}

export const BrowserMenuSheet: React.FC<BrowserMenuSheetProps> = ({
  isOpen,
  onClose,
  onTriggerDeepScan,
  onCopyUrl,
  onSharePage,
}) => {
  const {
    navigate,
    t,
    settings,
    updateSettings,
    tabs,
    currentTab,
    createTab,
    duplicateTab,
    closeOtherTabs,
    openFindInPage,
    isCurrentTabBookmarked,
    toggleBookmarkForCurrentTab,
    pinCurrentTabToSpeedDial,
    toggleOmniboxPosition,
    toggleExtension,
    enabledExtensionCount,
    activeDownloadsCount,
    pageZoom,
    setPageZoom,
  } = useApp();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isNightWeb = settings.enabledExtensionIds.includes('force-dark-web');
  const isReaderMode = settings.enabledExtensionIds.includes('reader-focus-mode');
  const isPinned = isUrlPinned(settings.speedDialPins, currentTab.url);
  const hasUrl = Boolean(currentTab.url);

  const actions: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
  }> = [
    {
      id: 'new-tab',
      label: t('new_tab'),
      icon: <Plus className="h-5 w-5 text-[var(--salvia-cyan)]" />,
      onClick: () => {
        createTab({ isPrivate: false });
        onClose();
      },
    },
    {
      id: 'private-tab',
      label: t('new_private_tab'),
      icon: <Lock className="h-5 w-5 text-[var(--salvia-iris-light)]" />,
      onClick: () => {
        createTab({ isPrivate: true });
        onClose();
      },
    },
    {
      id: 'bookmark',
      label: isCurrentTabBookmarked ? t('bookmark_remove') : t('bookmark_add'),
      icon: isCurrentTabBookmarked ? (
        <BookmarkCheck className="h-5 w-5 fill-current text-[var(--salvia-gold)]" />
      ) : (
        <Bookmark className="h-5 w-5 text-[var(--salvia-gold)]" />
      ),
      disabled: !hasUrl,
      active: isCurrentTabBookmarked,
      onClick: () => {
        toggleBookmarkForCurrentTab();
        onClose();
      },
    },
    {
      id: 'pin-home',
      label: t('speed_dial_pin'),
      icon: <Pin className="h-5 w-5 text-[var(--salvia-cyan)]" />,
      disabled: !hasUrl || isPinned,
      active: isPinned,
      onClick: () => {
        pinCurrentTabToSpeedDial();
        onClose();
      },
    },
    {
      id: 'find',
      label: t('find_in_page'),
      icon: <Search className="h-5 w-5 text-[var(--salvia-text)]" />,
      disabled: !hasUrl,
      onClick: () => {
        openFindInPage();
        onClose();
      },
    },
    {
      id: 'deep-scan',
      label: t('media_deep_scan'),
      icon: <Radar className="h-5 w-5 text-[var(--salvia-iris)]" />,
      onClick: () => {
        onClose();
        onTriggerDeepScan();
      },
    },
    {
      id: 'share',
      label: t('share_page'),
      icon: <Share2 className="h-5 w-5 text-[var(--salvia-text-muted)]" />,
      disabled: !hasUrl,
      onClick: onSharePage,
    },
    {
      id: 'copy',
      label: t('copy_link'),
      icon: <Copy className="h-5 w-5 text-[var(--salvia-text-muted)]" />,
      disabled: !hasUrl,
      onClick: onCopyUrl,
    },
    {
      id: 'duplicate',
      label: t('duplicate_tab'),
      icon: <Copy className="h-5 w-5 text-[var(--salvia-cyan)]" />,
      onClick: () => {
        duplicateTab(currentTab.id);
        onClose();
      },
    },
    {
      id: 'close-others',
      label: t('close_other_tabs'),
      icon: <X className="h-5 w-5 text-[var(--salvia-pink)]" />,
      disabled: tabs.length <= 1,
      onClick: () => {
        closeOtherTabs(currentTab.id);
        onClose();
      },
    },
    {
      id: 'extensions',
      label: `${t('extensions')} (${enabledExtensionCount})`,
      icon: <Puzzle className="h-5 w-5 text-[var(--salvia-iris)]" />,
      onClick: () => {
        onClose();
        navigate('extensions');
      },
    },
    {
      id: 'history',
      label: t('history'),
      icon: <History className="h-5 w-5 text-[var(--salvia-text-muted)]" />,
      onClick: () => {
        onClose();
        navigate('history');
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--salvia-overlay)] p-0 md:items-start md:justify-end md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        data-testid="browser-menu-sheet"
        onClick={(e) => e.stopPropagation()}
        className="animate-salvia-sheet-in flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] shadow-2xl md:mt-16 md:max-w-[400px] md:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--salvia-border)] md:hidden" />

        {/* Header Row: Zoom & Direct Downloads/Settings Jump */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--salvia-border)]/60 px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPageZoom(Math.max(75, pageZoom - 10))}
              aria-label={t('zoom_out')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageZoom(100)}
              aria-label={t('zoom_reset')}
              className="font-data tabular-nums min-h-11 rounded-xl px-2.5 text-[12px] font-bold text-[var(--salvia-text)] hover:bg-[var(--salvia-elevated)]"
            >
              {pageZoom}%
            </button>
            <button
              type="button"
              onClick={() => setPageZoom(Math.min(150, pageZoom + 10))}
              aria-label={t('zoom_in')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('downloads');
              }}
              aria-label={t('downloads')}
              className="flex h-11 items-center gap-1.5 rounded-xl bg-[var(--salvia-elevated)] px-3 text-[12px] font-semibold text-[var(--salvia-cyan-text)] hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              <span className="font-data tabular-nums">{activeDownloadsCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('settings');
              }}
              aria-label={t('settings')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 4-Column Thumb Grid */}
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {actions.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={item.onClick}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-colors disabled:opacity-35 ${
                  item.active
                    ? 'border-[var(--salvia-iris)]/70 bg-[var(--salvia-elevated)]'
                    : 'border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)]/70 hover:border-[var(--salvia-iris)]/50 hover:bg-[var(--salvia-elevated)]'
                }`}
              >
                {item.icon}
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-[var(--salvia-text)]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Toggles */}
          <div className="mt-4 border-t border-[var(--salvia-border)]/60 pt-3">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--salvia-text-subtle)]">
              {t('quick_toggles')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={settings.isDesktopSite}
                onClick={() => updateSettings({ isDesktopSite: !settings.isDesktopSite })}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl border px-3 text-start text-[12px] font-semibold transition-colors ${
                  settings.isDesktopSite
                    ? 'border-[var(--salvia-cyan)] bg-[var(--salvia-cyan-container)] text-[var(--salvia-cyan-text)]'
                    : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text)]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Monitor className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('desktop_site')}</span>
                </span>
                {settings.isDesktopSite ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={isNightWeb}
                onClick={() => toggleExtension('force-dark-web')}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl border px-3 text-start text-[12px] font-semibold transition-colors ${
                  isNightWeb
                    ? 'border-[var(--salvia-iris)] bg-[var(--salvia-iris-soft)] text-[var(--salvia-iris-light)]'
                    : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text)]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Moon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('site_shield_night_web')}</span>
                </span>
                {isNightWeb ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={isReaderMode}
                onClick={() => toggleExtension('reader-focus-mode')}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl border px-3 text-start text-[12px] font-semibold transition-colors ${
                  isReaderMode
                    ? 'border-[var(--salvia-gold)] bg-[var(--salvia-gold-soft)] text-[var(--salvia-gold)]'
                    : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text)]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Eraser className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('site_shield_reader_mode')}</span>
                </span>
                {isReaderMode ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>

              <button
                type="button"
                data-testid="menu-toggle-omnibox-pos"
                onClick={() => {
                  toggleOmniboxPosition();
                  onClose();
                }}
                className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] px-3 text-start text-[12px] font-semibold text-[var(--salvia-text)] hover:border-[var(--salvia-cyan)]"
              >
                <span className="flex items-center gap-2 truncate">
                  <ArrowDownUp className="h-4 w-4 shrink-0 text-[var(--salvia-cyan)]" />
                  <span className="truncate">
                    {settings.omniboxPosition === 'bottom' ? t('omnibox_top') : t('omnibox_bottom')}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
