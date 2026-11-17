import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Download,
  Globe,
  History,
  Layers,
  Lock,
  Moon,
  Pencil,
  Plus,
  Puzzle,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { BrowserNavRail } from '../components/BrowserNavRail';
import { DownloadItemRow } from '../components/DownloadItemRow';
import { OrbitalBrandMark } from '../components/OrbitalBrandMark';
import {
  BUILTIN_SHOWCASE_PAGES,
  SEARCH_ENGINE_OPTIONS,
  WIFI_HOLD_MARKER,
} from '../core/constants';
import { hostOfUrl } from '../core/adBlockRules';
import { classifyPastedLink } from '../core/pastedLink';
import { pinHostLabel, pinMonogram } from '../core/speedDial';
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
    openTabSwitcher,
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
    addSpeedDialPinAction,
    removeSpeedDialPinAction,
    showToast,
  } = useApp();

  const [pasteInput, setPasteInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [clipboardBanner, setClipboardBanner] = useState<{
    url: string;
    kind: 'MEDIA_FILE' | 'WEB_PAGE';
  } | null>(null);
  const [dismissedClipboard, setDismissedClipboard] = useState(false);
  const [editingPins, setEditingPins] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinUrlDraft, setPinUrlDraft] = useState('');
  const [pinTitleDraft, setPinTitleDraft] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const trimmedInput = pasteInput.trim();
  const normalizedPasteInput = (() => {
    if (!trimmedInput) return '';
    if (
      !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedInput) &&
      !/\s/.test(trimmedInput) &&
      trimmedInput.includes('.')
    ) {
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

  useEffect(() => {
    if (!pinModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pinModalOpen]);

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

  const handleAddPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addSpeedDialPinAction({ title: pinTitleDraft, url: pinUrlDraft });
    if (!res.ok) {
      setPinError(
        res.error === 'DUPLICATE_PIN' ? t('speed_dial_duplicate') : t('speed_dial_invalid_url')
      );
      return;
    }
    setPinUrlDraft('');
    setPinTitleDraft('');
    setPinError(null);
    setPinModalOpen(false);
  };

  const ForwardArrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[var(--salvia-bg)] text-[var(--salvia-text)]">
      <BrowserNavRail />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Compact Mobile Top Bar */}
        <header className="sticky top-0 z-20 flex h-13 items-center justify-between border-b border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/95 px-3 backdrop-blur-md md:hidden">
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
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-gold)]"
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
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-iris)]"
            >
              <Puzzle className="h-[18px] w-[18px]" />
              {enabledExtensionCount > 0 ? (
                <span className="font-data absolute top-2 end-2 h-2 w-2 rounded-full bg-[var(--salvia-cyan)]" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={openTabSwitcher}
              aria-label={t('tabs')}
              className="flex h-11 min-w-11 items-center justify-center rounded-xl px-1.5 text-[var(--salvia-text)] hover:bg-[var(--salvia-elevated)]"
            >
              <span className="font-data tabular-nums flex h-6 min-w-6 items-center justify-center rounded-md border-2 border-[var(--salvia-text-muted)] px-1 text-[11px] font-bold">
                {tabs.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('settings')}
              aria-label={t('settings')}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="animate-salvia-fade-up relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-7 px-4 py-6 sm:px-8 sm:py-9">
          {/* Compact Browser Start Hero & Smart Omnibox */}
          <section className="flex flex-col items-center text-center">
            <div className="mb-3 flex items-center justify-center">
              <OrbitalBrandMark size={74} showRing={false} />
            </div>

            <h1 className="font-display text-balance text-[24px] font-bold tracking-tight text-[var(--salvia-text)] sm:text-[30px]">
              {t('home_hero_title')}
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--salvia-text-muted)] sm:text-[14px]">
              {t('home_hero_subtitle')}
            </p>

            {isBatterySaverActive ? (
              <button
                type="button"
                onClick={() => navigate('settings')}
                className="mt-2.5 inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-[var(--salvia-cyan-text)] hover:underline"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                <span>{t('battery_active_badge')}</span>
              </button>
            ) : null}

            {/* Unified Browser Omnibox */}
            <div className="mt-5 w-full max-w-3xl text-start">
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
                <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-2 shadow-[var(--salvia-card-shadow)] focus-within:border-[var(--salvia-iris)] sm:flex-nowrap sm:gap-2.5">
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
                      aria-label={t('search_or_type_url')}
                      className="h-11 min-w-0 flex-1 bg-transparent px-2.5 text-[14px] text-[var(--salvia-text)] placeholder-[var(--salvia-text-subtle)] outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      {pasteInput ? (
                        <button
                          type="button"
                          onClick={() => setPasteInput('')}
                          aria-label={t('home_clear_input')}
                          title={t('home_clear_input')}
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-subtle)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        aria-label={t('home_paste_from_clipboard')}
                        title={t('home_paste_from_clipboard')}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-cyan)] hover:bg-[var(--salvia-elevated)]"
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

          {/* Editable Speed Dial & Quick Workspace */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
                {t('speed_dial_title')}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="speed-dial-edit-btn"
                  onClick={() => setEditingPins((prev) => !prev)}
                  className={`inline-flex min-h-10 items-center gap-1.5 text-[12px] font-semibold ${
                    editingPins
                      ? 'text-[var(--salvia-cyan-text)]'
                      : 'text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]'
                  }`}
                >
                  {editingPins ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  <span>{editingPins ? t('action_ok') : t('speed_dial_edit')}</span>
                </button>
                <button
                  type="button"
                  onClick={openTabSwitcher}
                  className="inline-flex min-h-10 items-center gap-1.5 text-[12px] font-semibold text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
                >
                  <Layers className="h-3.5 w-3.5 text-[var(--salvia-cyan)]" />
                  <span className="font-data tabular-nums">
                    {tabs.length} {!isRtl && tabs.length === 1 ? 'Tab' : t('tabs')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('extensions')}
                  className="inline-flex min-h-10 items-center gap-1.5 text-[12px] font-semibold text-[var(--salvia-iris)] hover:underline"
                >
                  <Puzzle className="h-3.5 w-3.5" />
                  <span className="font-data tabular-nums">
                    {t('extensions')} ({enabledExtensionCount})
                  </span>
                </button>
              </div>
            </div>

            {/* Pinned Speed Dial Sites */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {settings.speedDialPins.map((pin) => {
                const monogram = pinMonogram(pin.title, pin.url);
                const host = pinHostLabel(pin.url);
                return (
                  <div
                    key={pin.id}
                    className="group relative flex min-h-[96px] flex-col justify-between rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)] p-3.5 shadow-[var(--salvia-card-shadow)] transition-colors duration-150 hover:border-[var(--salvia-iris)]/70"
                  >
                    {editingPins ? (
                      <button
                        type="button"
                        onClick={() => removeSpeedDialPinAction(pin.id)}
                        aria-label={`${t('speed_dial_unpin')}: ${pin.title}`}
                        className="absolute top-1.5 end-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] text-[var(--salvia-pink-text)] hover:bg-[var(--salvia-pink-soft)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => openUrlFromLibrary(pin.url)}
                      className="flex h-full w-full flex-col items-start justify-between text-start"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-elevated)] font-display text-[16px] font-bold"
                        style={{ color: pin.accent }}
                      >
                        {monogram}
                      </div>
                      <div className="mt-3 w-full">
                        <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                          {pin.title}
                        </p>
                        <p className="font-data truncate text-[11px] text-[var(--salvia-text-subtle)]">
                          {host}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}

              {/* Add Speed Dial Pin Tile */}
              <button
                type="button"
                data-testid="speed-dial-add-btn"
                onClick={() => {
                  setPinUrlDraft('');
                  setPinTitleDraft('');
                  setPinError(null);
                  setPinModalOpen(true);
                }}
                className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--salvia-border-strong)] bg-[var(--salvia-surface)]/50 p-3.5 text-[var(--salvia-text-muted)] transition-colors hover:border-[var(--salvia-cyan)] hover:text-[var(--salvia-cyan-text)]"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[12px] font-semibold">{t('speed_dial_pin')}</span>
              </button>
            </div>

            {/* Browser Quick Launch Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate('browser')}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)] px-4 py-3 text-start shadow-[var(--salvia-card-shadow)] hover:border-[var(--salvia-iris)]/70"
              >
                <Globe className="h-5 w-5 shrink-0 text-[var(--salvia-iris)]" />
                <div className="min-w-0">
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
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)] px-4 py-3 text-start shadow-[var(--salvia-card-shadow)] hover:border-[var(--salvia-iris)]/70"
              >
                <Lock className="h-5 w-5 shrink-0 text-[var(--salvia-iris-light)]" />
                <div className="min-w-0">
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
                className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)] px-4 py-3 text-start shadow-[var(--salvia-card-shadow)] hover:border-[var(--salvia-gold)]/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Download className="h-5 w-5 shrink-0 text-[var(--salvia-gold)]" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                      {t('downloads')}
                    </p>
                    <p className="truncate text-[11px] text-[var(--salvia-text-subtle)]">
                      {BUILTIN_SHOWCASE_PAGES[0].title}
                    </p>
                  </div>
                </div>
                {activeDownloadsCount > 0 ? (
                  <span className="font-data tabular-nums text-[12px] font-bold text-[var(--salvia-gold)]">
                    {activeDownloadsCount}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Bookmarks & Recent Visits compact strip */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] p-4 shadow-[var(--salvia-card-shadow)]">
                <div className="mb-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('bookmarks')}
                    className="flex items-center gap-2 text-[13px] font-semibold text-[var(--salvia-gold)] hover:underline"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>{t('bookmarks')}</span>
                  </button>
                  <span className="font-data tabular-nums text-[11px] text-[var(--salvia-text-subtle)]">
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

              <div className="rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] p-4 shadow-[var(--salvia-card-shadow)]">
                <div className="mb-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('history')}
                    className="flex items-center gap-2 text-[13px] font-semibold text-[var(--salvia-cyan-text)] hover:underline"
                  >
                    <History className="h-4 w-4" />
                    <span>{t('recent_history_title')}</span>
                  </button>
                  <span className="font-data tabular-nums text-[11px] text-[var(--salvia-text-subtle)]">
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
              <div className="rounded-2xl border border-[var(--salvia-border)]/60 bg-[var(--salvia-surface)] p-4 text-[13px] text-[var(--salvia-text-muted)]">
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

      {/* Add Speed Dial Pin Modal */}
      {pinModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setPinModalOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-label={t('speed_dial_add_title')}
            onSubmit={handleAddPinSubmit}
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-md space-y-3.5 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
              {t('speed_dial_add_title')}
            </h2>

            <div>
              <label
                htmlFor="speed-dial-url-input"
                className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('speed_dial_url_label')}
              </label>
              <input
                id="speed-dial-url-input"
                type="text"
                autoFocus
                dir="ltr"
                value={pinUrlDraft}
                onChange={(e) => {
                  setPinUrlDraft(e.target.value);
                  setPinError(null);
                }}
                placeholder="https://example.com"
                className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
              />
            </div>

            <div>
              <label
                htmlFor="speed-dial-name-input"
                className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('speed_dial_name_label')}
              </label>
              <input
                id="speed-dial-name-input"
                type="text"
                value={pinTitleDraft}
                onChange={(e) => setPinTitleDraft(e.target.value)}
                placeholder="Example"
                className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
              />
            </div>

            {pinError ? <p className="text-[12px] text-[var(--salvia-pink-text)]">{pinError}</p> : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="min-h-11 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('action_cancel')}
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-5 text-[13px] font-bold text-white"
              >
                {t('action_ok')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
