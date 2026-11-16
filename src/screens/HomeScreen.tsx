import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Download,
  Film,
  Globe,
  History,
  Lock,
  Moon,
  Puzzle,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { BrowserNavRail } from '../components/BrowserNavRail';
import { DownloadItemRow } from '../components/DownloadItemRow';
import { LOGO_ASSET_PATH, OrbitalBrandMark } from '../components/OrbitalBrandMark';
import {
  BUILTIN_SHOWCASE_PAGES,
  SEARCH_ENGINE_OPTIONS,
  WIFI_HOLD_MARKER,
} from '../core/constants';
import { hostOfUrl } from '../core/adBlockRules';
import { classifyPastedLink } from '../core/pastedLink';
import { useApp } from '../store/AppContext';
import type { SearchEngineKey } from '../types/models';

export const HomeScreen: React.FC = () => {
  const {
    navigate,
    isRtl,
    t,
    settings,
    resolvedTheme,
    isBatterySaverActive,
    enabledExtensionCount,
    updateSettings,
    tabs,
    bookmarks,
    history,
    downloads,
    activeDownloadsCount,
    createTab,
    openPastedLink,
    isExtractingLink,
    extractFromPastedPage,
    openUrlFromLibrary,
    getAddressSuggestions,
    showToast,
  } = useApp();

  const [pasteInput, setPasteInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [clipboardBanner, setClipboardBanner] = useState<{
    url: string;
    kind: 'MEDIA_FILE' | 'WEB_PAGE';
  } | null>(null);
  const [dismissedClipboard, setDismissedClipboard] = useState(false);

  const trimmedInput = pasteInput.trim();
  const normalizedPasteInput = (() => {
    if (!trimmedInput) return '';
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedInput) && !/\s/.test(trimmedInput) && trimmedInput.includes('.')) {
      return `https://${trimmedInput}`;
    }
    return trimmedInput;
  })();

  const linkKind = classifyPastedLink(normalizedPasteInput);
  const isSearchQuery = Boolean(trimmedInput) && !linkKind;
  const suggestions = inputFocused ? getAddressSuggestions(trimmedInput) : [];

  const activeItems = downloads
    .filter(
      (d) =>
        d.status === 'DOWNLOADING' ||
        d.status === 'QUEUED' ||
        d.status === 'PREPARING' ||
        d.status === 'RESOLVING' ||
        (d.status === 'PAUSED' && d.error === WIFI_HOLD_MARKER)
    )
    .slice(0, 3);

  useEffect(() => {
    let active = true;
    const inspectClipboard = async () => {
      if (dismissedClipboard || !navigator.clipboard?.readText) return;
      try {
        const text = await navigator.clipboard.readText();
        if (!active || !text) return;
        const kind = classifyPastedLink(text);
        if (kind) {
          setClipboardBanner({ url: text.trim(), kind });
        }
      } catch {
        // Ignore silent permission denial
      }
    };
    inspectClipboard();
    return () => {
      active = false;
    };
  }, [dismissedClipboard]);

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      showToast(t('home_empty_clipboard'));
      return;
    }
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        showToast(t('home_empty_clipboard'));
        return;
      }
      setPasteInput(text);
    } catch {
      showToast(t('home_empty_clipboard'));
    }
  };

  const handleSubmitOmnibox = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trimmedInput) {
      showToast(t('home_invalid_link'));
      return;
    }
    setInputFocused(false);
    openPastedLink(linkKind ? normalizedPasteInput : trimmedInput);
  };

  const ForwardArrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[var(--salvia-bg)] text-[var(--salvia-text)]">
      <BrowserNavRail />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Large low-opacity watermark logo in HomeScreen backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden md:ps-[68px]"
        >
          <img
            src={LOGO_ASSET_PATH}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            className="h-[min(92vw,760px)] w-[min(92vw,760px)] select-none object-contain opacity-[0.06] dark:opacity-[0.17] dark:mix-blend-screen"
            style={{
              maskImage:
                'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0) 88%)',
              WebkitMaskImage:
                'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0) 88%)',
            }}
          />
        </div>

        {/* Compact Mobile Top Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/90 px-3 backdrop-blur-md md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <OrbitalBrandMark size={28} showRing={false} />
            <span className="font-display truncate text-[15px] font-bold tracking-tight text-[var(--salvia-text)]">
              {t('app_name')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' })}
              aria-label={resolvedTheme === 'dark' ? t('theme_light') : t('theme_dark')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-gold)]"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('extensions')}
              aria-label={t('extensions')}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-iris)]"
            >
              <Puzzle className="h-[18px] w-[18px]" />
              {enabledExtensionCount > 0 ? (
                <span className="font-data absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-[var(--salvia-cyan)]" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => navigate('settings')}
              aria-label={t('settings')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => navigate('browser')}
              className="ms-1 flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-3 text-[12px] font-semibold text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t('home_open_browser')}</span>
            </button>
          </div>
        </header>

        <main className="animate-salvia-fade-up relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-8 px-4 py-6 sm:px-8 sm:py-10">
          {/* Cosmic Emblem + Hero Omnibox */}
          <section className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex items-center justify-center">
              <OrbitalBrandMark size={104} showRing={false} />
            </div>

            <h1 className="font-display text-balance text-[26px] font-bold tracking-tight text-[var(--salvia-text)] sm:text-[34px]">
              {t('home_hero_title')}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--salvia-text-muted)] sm:text-[15px]">
              {t('home_hero_subtitle')}
            </p>

            {isBatterySaverActive ? (
              <button
                type="button"
                onClick={() => navigate('settings')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[var(--salvia-cyan)]/40 bg-[var(--salvia-cyan-container)] px-3 py-1 text-[12px] font-semibold text-[var(--salvia-cyan-text)]"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                <span>{t('battery_active_badge')}</span>
              </button>
            ) : null}

            {/* Unified Smart Omnibox + Link Classifier */}
            <div className="mt-6 w-full max-w-3xl text-start">
              {clipboardBanner ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--salvia-cyan)]/45 bg-[var(--salvia-cyan-container)] px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[var(--salvia-cyan-text)]">
                      {clipboardBanner.kind === 'MEDIA_FILE'
                        ? t('home_clipboard_media')
                        : t('home_clipboard_page')}
                    </p>
                    <p className="font-data truncate text-[12px] text-[var(--salvia-text)]">
                      {clipboardBanner.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPasteInput(clipboardBanner.url);
                        setClipboardBanner(null);
                      }}
                      className="min-h-10 rounded-xl bg-[#4CC4FF] px-3.5 text-[12px] font-bold text-[#000000]"
                    >
                      {t('home_clipboard_use')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClipboardBanner(null);
                        setDismissedClipboard(true);
                      }}
                      className="min-h-10 rounded-xl px-2.5 text-[12px] font-medium text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
                    >
                      {t('home_clipboard_dismiss')}
                    </button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmitOmnibox} className="relative">
                <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)]/95 p-2.5 shadow-[var(--salvia-card-shadow)] backdrop-blur-md focus-within:border-[var(--salvia-iris)] sm:flex-nowrap sm:gap-2.5">
                  <div className="order-2 flex shrink-0 items-center sm:order-1">
                    <label htmlFor="home-search-engine" className="sr-only">
                      {t('settings_search_engine')}
                    </label>
                    <select
                      id="home-search-engine"
                      value={settings.searchEngine}
                      onChange={(e) =>
                        updateSettings({ searchEngine: e.target.value as SearchEngineKey })
                      }
                      className="h-11 cursor-pointer rounded-2xl bg-[var(--salvia-elevated)] px-3 text-[12px] font-semibold text-[var(--salvia-cyan-text)] outline-none hover:bg-[var(--salvia-surface-muted)]"
                    >
                      {SEARCH_ENGINE_OPTIONS.map((eng) => (
                        <option
                          key={eng}
                          value={eng}
                          className="bg-[var(--salvia-surface)] text-[var(--salvia-text)]"
                        >
                          {eng}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="order-1 relative flex w-full min-w-0 items-center border-b border-[var(--salvia-border)]/60 pb-1.5 sm:order-2 sm:w-auto sm:flex-1 sm:border-b-0 sm:border-s sm:pb-0 sm:ps-2">
                    <Search className="pointer-events-none ms-1.5 h-4 w-4 shrink-0 text-[var(--salvia-text-subtle)]" />
                    <input
                      type="text"
                      value={pasteInput}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => window.setTimeout(() => setInputFocused(false), 160)}
                      onChange={(e) => setPasteInput(e.target.value)}
                      placeholder={`${t('search_or_type_url')} · ${t('home_paste_hint')}`}
                      dir="ltr"
                      aria-label={t('home_paste_title')}
                      className="h-11 min-w-0 flex-1 bg-transparent px-2.5 text-[14px] text-[var(--salvia-text)] placeholder-[var(--salvia-text-subtle)] outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      {pasteInput ? (
                        <button
                          type="button"
                          onClick={() => setPasteInput('')}
                          aria-label={t('home_clear_input')}
                          title={t('home_clear_input')}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--salvia-text-subtle)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        aria-label={t('home_paste_from_clipboard')}
                        title={t('home_paste_from_clipboard')}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--salvia-cyan)] hover:bg-[var(--salvia-elevated)]"
                      >
                        <ClipboardPaste className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="order-3 flex flex-1 shrink-0 items-center justify-end gap-1.5 sm:flex-initial">
                    {linkKind === 'WEB_PAGE' ? (
                      <button
                        type="button"
                        disabled={isExtractingLink}
                        onClick={() => extractFromPastedPage(normalizedPasteInput)}
                        className="flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-[var(--salvia-gold)]/60 bg-[var(--salvia-gold-soft)] px-3.5 text-[13px] font-bold text-[var(--salvia-gold)] transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t('home_extract_video')}</span>
                      </button>
                    ) : null}

                    <button
                      type="submit"
                      className={`flex h-11 flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 text-[14px] font-bold shadow-md transition-opacity hover:opacity-95 sm:flex-initial ${
                        linkKind === 'MEDIA_FILE'
                          ? 'bg-gradient-to-r from-[#D9AE54] to-[#4CC4FF] text-[#000000]'
                          : 'bg-gradient-to-r from-[#8F6BFF] to-[#4CC4FF] text-white'
                      }`}
                    >
                      {linkKind === 'MEDIA_FILE' ? (
                        <>
                          <Download className="h-4 w-4" />
                          <span>{t('home_download_file')}</span>
                        </>
                      ) : (
                        <>
                          <span>{isSearchQuery ? t('address_go') : t('home_open_link')}</span>
                          <ForwardArrow className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {suggestions.length > 0 ? (
                  <div className="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] shadow-2xl">
                    {suggestions.map((sug) => (
                      <button
                        key={sug.url}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPasteInput(sug.url);
                          setInputFocused(false);
                          openUrlFromLibrary(sug.url);
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--salvia-border)]/40 px-4 py-3 text-start last:border-none hover:bg-[var(--salvia-elevated)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                            {sug.title}
                          </p>
                          <p className="font-data truncate text-[11px] text-[var(--salvia-text-subtle)]">
                            {sug.url}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--salvia-cyan-text)]">
                          {sug.source}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>
            </div>
          </section>

          {/* Speed Dial & Workspace Shortcuts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
                {t('speed_dial_title')}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('extensions')}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--salvia-iris)] hover:underline"
                >
                  <Puzzle className="h-3.5 w-3.5" />
                  <span>
                    {t('extensions')} ({enabledExtensionCount})
                  </span>
                </button>
                <span className="font-data text-[12px] text-[var(--salvia-text-subtle)]">
                  {tabs.length} {!isRtl && tabs.length === 1 ? 'Tab' : t('tabs')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => openUrlFromLibrary(BUILTIN_SHOWCASE_PAGES[0].url)}
                className="group flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)]/90 p-4 text-start shadow-[var(--salvia-card-shadow)] backdrop-blur-md transition-colors duration-150 hover:border-[var(--salvia-cyan)]/70"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-cyan)]">
                  <Film className="h-5 w-5" />
                </div>
                <div className="mt-3 w-full">
                  <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                    {BUILTIN_SHOWCASE_PAGES[0].title}
                  </p>
                  <p className="font-data truncate text-[11px] text-[var(--salvia-text-subtle)]">
                    salvia.showcase
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('browser')}
                className="flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)]/90 p-4 text-start shadow-[var(--salvia-card-shadow)] backdrop-blur-md transition-colors duration-150 hover:border-[var(--salvia-iris)]/70"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-iris)]">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="mt-3 w-full">
                  <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                    {t('home_open_browser')}
                  </p>
                  <p className="font-data truncate text-[11px] text-[var(--salvia-text-subtle)]">
                    {settings.searchEngine}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  createTab({ isPrivate: true });
                  navigate('browser');
                }}
                className="flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)]/90 p-4 text-start shadow-[var(--salvia-card-shadow)] backdrop-blur-md transition-colors duration-150 hover:border-[var(--salvia-iris)]/70"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-iris-light)]">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="mt-3 w-full">
                  <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                    {t('new_private_tab')}
                  </p>
                  <p className="truncate text-[11px] text-[var(--salvia-text-subtle)]">
                    {t('private_browsing')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('downloads')}
                className="flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)]/90 p-4 text-start shadow-[var(--salvia-card-shadow)] backdrop-blur-md transition-colors duration-150 hover:border-[var(--salvia-gold)]/70"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-gold)]">
                    <Download className="h-5 w-5" />
                  </div>
                  {activeDownloadsCount > 0 ? (
                    <span className="font-data text-[12px] font-bold text-[var(--salvia-gold)]">
                      {activeDownloadsCount}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 w-full">
                  <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                    {t('downloads')}
                  </p>
                  <p className="truncate text-[11px] text-[var(--salvia-text-subtle)]">
                    {t('download_active')}
                  </p>
                </div>
              </button>
            </div>

            {/* Bookmarks & Recent Visits compact strip */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)]/85 p-4 shadow-[var(--salvia-card-shadow)] backdrop-blur-sm">
                <div className="mb-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('bookmarks')}
                    className="flex items-center gap-2 text-[13px] font-semibold text-[var(--salvia-gold)] hover:underline"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>{t('bookmarks')}</span>
                  </button>
                  <span className="font-data text-[11px] text-[var(--salvia-text-subtle)]">
                    {bookmarks.length}
                  </span>
                </div>
                {bookmarks.length === 0 ? (
                  <p className="py-2 text-[12px] text-[var(--salvia-text-subtle)]">
                    {t('no_bookmarks')}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {bookmarks.slice(0, 3).map((bm) => (
                      <button
                        key={bm.id}
                        type="button"
                        onClick={() => openUrlFromLibrary(bm.url)}
                        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-2.5 text-start hover:bg-[var(--salvia-elevated)]"
                      >
                        <span className="truncate text-[13px] text-[var(--salvia-text)]">
                          {bm.title}
                        </span>
                        <span className="font-data shrink-0 text-[11px] text-[var(--salvia-text-subtle)]">
                          {hostOfUrl(bm.url) || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)]/85 p-4 shadow-[var(--salvia-card-shadow)] backdrop-blur-sm">
                <div className="mb-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('history')}
                    className="flex items-center gap-2 text-[13px] font-semibold text-[var(--salvia-cyan-text)] hover:underline"
                  >
                    <History className="h-4 w-4" />
                    <span>{t('recent_history_title')}</span>
                  </button>
                  <span className="font-data text-[11px] text-[var(--salvia-text-subtle)]">
                    {history.length}
                  </span>
                </div>
                {history.length === 0 ? (
                  <p className="py-2 text-[12px] text-[var(--salvia-text-subtle)]">
                    {t('no_history')}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {history.slice(0, 3).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => openUrlFromLibrary(h.url)}
                        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-2.5 text-start hover:bg-[var(--salvia-elevated)]"
                      >
                        <span className="truncate text-[13px] text-[var(--salvia-text)]">
                          {h.title}
                        </span>
                        <span className="font-data shrink-0 text-[11px] text-[var(--salvia-text-subtle)]">
                          {hostOfUrl(h.url) || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Downloading now */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
                {t('home_active_title')}
              </h2>
              <button
                type="button"
                onClick={() => navigate('downloads')}
                className="flex min-h-10 items-center gap-1 text-[13px] font-semibold text-[var(--salvia-cyan-text)] hover:underline"
              >
                <span>{t('home_active_see_all')}</span>
                <ForwardArrow className="h-4 w-4" />
              </button>
            </div>

            {activeItems.length === 0 ? (
              <div className="rounded-2xl border border-[var(--salvia-border)]/60 bg-[var(--salvia-surface)]/80 p-4 text-[13px] text-[var(--salvia-text-muted)] backdrop-blur-sm">
                {t('home_active_empty')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeItems.map((item) => (
                  <DownloadItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
