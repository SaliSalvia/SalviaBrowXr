import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Film,
  Home,
  Layers,
  Lock,
  MoreVertical,
  Play,
  Plus,
  Puzzle,
  RotateCw,
  Search,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import { BrowserMenuSheet } from '../components/BrowserMenuSheet';
import { BrowserNavRail } from '../components/BrowserNavRail';
import { FloatingDownloadButton } from '../components/FloatingDownloadButton';
import { OrbitalBrandMark } from '../components/OrbitalBrandMark';
import { SiteShieldPopover } from '../components/SiteShieldPopover';
import { BUILTIN_SHOWCASE_PAGES } from '../core/constants';
import { hostOfUrl } from '../core/adBlockRules';
import { formatDurationSeconds, formatFileSize } from '../core/mediaResolver';
import { getSalviaNative } from '../core/nativeBridge';
import { useApp } from '../store/AppContext';

export const BrowserScreen: React.FC = () => {
  const {
    navigate,
    isRtl,
    t,
    settings,
    updateSettings,
    enabledExtensionCount,
    getExtensionPayloadForUrl,
    tabs,
    currentTab,
    hibernatedTabIds,
    tabPages,
    openTabSwitcher,
    createTab,
    switchTab,
    closeTab,
    navigateCurrentTab,
    reloadCurrentTab,
    stopLoadingCurrentTab,
    goBackCurrentTab,
    goForwardCurrentTab,
    goHomeInCurrentTab,
    blockedCleartextUrl,
    allowCleartextAndRetry,
    dismissCleartextBlock,
    isCurrentTabBookmarked,
    toggleBookmarkForCurrentTab,
    bookmarks,
    getAddressSuggestions,
    currentTabCandidates,
    openMediaTray,
    isMediaTrayVisible,
    qualitySheet,
    isTabSwitcherVisible,
    openQualitySheetForCandidate,
    downloadMainMedia,
    currentMainCandidate,
    findInPage,
    openFindInPage,
    closeFindInPage,
    updateFindQuery,
    setFindResult,
    isNativeBrowserEngine,
    nativeNavCaps,
    pageZoom,
    reportDetectedMediaFromBridge,
    reportVisibleMediaFromBridge,
    rescanCurrentTabMedia,
    showToast,
  } = useApp();

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const page = tabPages[currentTab.id];
  const [addressInput, setAddressInput] = useState(currentTab.url || '');
  const [addressFocused, setAddressFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);

  const iframeDocGenRef = useRef(0);
  const lastAppliedExtKeyRef = useRef('');

  useEffect(() => {
    setAddressInput(currentTab.url || '');
  }, [currentTab.id, currentTab.url]);

  useEffect(() => {
    iframeDocGenRef.current = 0;
    lastAppliedExtKeyRef.current = '';
  }, [currentTab.id, page?.html]);

  const applyExtensionsOnce = useCallback(
    (gen: number) => {
      const win = iframeRef.current?.contentWindow;
      if (!win || !currentTab.url || gen <= 0) return;
      const payload = getExtensionPayloadForUrl(currentTab.url);
      const signature = `${gen}|${currentTab.id}|${currentTab.url}|${payload.css}|${payload.js}`;
      if (signature === lastAppliedExtKeyRef.current) return;
      lastAppliedExtKeyRef.current = signature;
      win.postMessage(
        {
          target: 'salvia-iframe',
          type: 'apply-extensions',
          css: payload.css,
          js: payload.js,
        },
        '*'
      );
    },
    [currentTab.id, currentTab.url, getExtensionPayloadForUrl]
  );

  const handleIframeLoad = useCallback(() => {
    iframeDocGenRef.current += 1;
    applyExtensionsOnce(iframeDocGenRef.current);
  }, [applyExtensionsOnce]);

  useEffect(() => {
    if (iframeDocGenRef.current > 0) {
      applyExtensionsOnce(iframeDocGenRef.current);
    }
  }, [applyExtensionsOnce, settings.enabledExtensionIds, settings.customExtensions]);

  // Desktop keyboard shortcuts (Ctrl/Cmd + L, T, F)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      } else if (key === 't') {
        e.preventDefault();
        createTab({ isPrivate: false });
      } else if (key === 'f') {
        e.preventDefault();
        openFindInPage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createTab, openFindInPage]);

  // Listen to bridge postMessages from proxied iframe
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as {
        source?: string;
        type?: string;
        payload?: {
          pageUrl?: string;
          items?: Array<{
            url: string;
            tag: string;
            type: string;
            visible: boolean;
            durationMs?: number | null;
            width?: number | null;
            height?: number | null;
            muted?: boolean;
            hasControls?: boolean;
            isAd?: boolean;
            isSuggested?: boolean;
          }>;
          mediaUrl?: string;
          url?: string;
          matches?: number;
          active?: number;
        };
      };
      if (!data || data.source !== 'salvia-browser-bridge' || !data.payload) return;
      const frameWindow = iframeRef.current?.contentWindow;
      if (!frameWindow || ev.source !== frameWindow) return;

      if (data.type === 'media-dom' && Array.isArray(data.payload.items)) {
        reportDetectedMediaFromBridge(
          currentTab.id,
          data.payload.pageUrl || currentTab.url,
          data.payload.items
        );
      } else if (data.type === 'visible-media' && data.payload.mediaUrl) {
        reportVisibleMediaFromBridge(
          currentTab.id,
          data.payload.pageUrl || currentTab.url,
          data.payload.mediaUrl
        );
      } else if (data.type === 'navigate' && data.payload.url) {
        if (/^https?:\/\//i.test(data.payload.url)) navigateCurrentTab(data.payload.url);
      } else if (data.type === 'find-result') {
        setFindResult(data.payload.matches ?? 0, data.payload.active ?? 0);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [
    currentTab.id,
    currentTab.url,
    navigateCurrentTab,
    reportDetectedMediaFromBridge,
    reportVisibleMediaFromBridge,
    setFindResult,
  ]);

  const showcasePage = page?.isDemoShowcase
    ? BUILTIN_SHOWCASE_PAGES.find((p) => p.url === page.url) || BUILTIN_SHOWCASE_PAGES[0]
    : null;

  const suggestions = addressFocused ? getAddressSuggestions(addressInput) : [];
  const isShowcaseUrl = (currentTab.url || '').startsWith('https://salvia.showcase/');
  const isHttps = !isShowcaseUrl && (currentTab.url || '').startsWith('https://');
  const isHttp = (currentTab.url || '').startsWith('http://');
  const canGoBack =
    currentTab.historyIndex > 0 || Boolean(nativeNavCaps[currentTab.id]?.canGoBack);
  const canGoForward =
    currentTab.historyIndex < currentTab.historyStack.length - 1 ||
    Boolean(nativeNavCaps[currentTab.id]?.canGoForward);

  const isNativeWebViewTarget =
    isNativeBrowserEngine &&
    Boolean(currentTab.url) &&
    !showcasePage &&
    !page?.error;
  const hasCoveringOverlay =
    menuOpen ||
    shieldOpen ||
    (addressFocused && suggestions.length > 0) ||
    isMediaTrayVisible ||
    qualitySheet !== null ||
    isTabSwitcherVisible ||
    Boolean(blockedCleartextUrl);
  const nativeViewportVisible = isNativeWebViewTarget && !hasCoveringOverlay;

  const sendFindToIframe = (query: string, backwards = false) => {
    updateFindQuery(query);
    if (isNativeWebViewTarget) {
      getSalviaNative()?.nativeFindInPage?.(query, backwards);
      return;
    }
    iframeRef.current?.contentWindow?.postMessage(
      { target: 'salvia-iframe', type: 'find', query, backwards },
      '*'
    );
  };

  // Keep Android native Chromium WebView synchronized with React viewport box & modal occlusion
  useEffect(() => {
    if (!isNativeBrowserEngine) return;
    const native = getSalviaNative();
    if (!native?.setBrowserViewport) return;

    const syncRect = () => {
      const el = viewportRef.current;
      if (!el || !nativeViewportVisible) {
        native.setBrowserViewport?.(false, 0, 0, 0, 0);
        return;
      }
      const rect = el.getBoundingClientRect();
      native.setBrowserViewport?.(true, rect.left, rect.top, rect.width, rect.height);
    };

    syncRect();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewportRef.current) {
      observer = new ResizeObserver(syncRect);
      observer.observe(viewportRef.current);
    }
    window.addEventListener('resize', syncRect);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', syncRect);
    };
  }, [isNativeBrowserEngine, nativeViewportVisible, findInPage, blockedCleartextUrl]);

  useEffect(() => {
    if (!isNativeBrowserEngine) return;
    return () => {
      getSalviaNative()?.setBrowserViewport?.(false, 0, 0, 0, 0);
    };
  }, [isNativeBrowserEngine]);

  // Keep Android floating download orb synchronized on top of native Chromium WebView
  useEffect(() => {
    if (!isNativeBrowserEngine) return;
    const native = getSalviaNative();
    if (!native?.setFloatingOrbState) return;

    const mediaCount = currentTabCandidates.length;
    const highlighted = currentMainCandidate !== null || mediaCount > 0;
    const orbVisible = settings.isFloatingButtonAlwaysVisible || mediaCount > 0;
    const sizeDp = Math.min(76, Math.max(46, settings.floatingButtonSize || 54));
    const desc = highlighted
      ? t('media_floating_ready', { count: mediaCount })
      : t('media_floating_idle');

    native.setFloatingOrbState(
      nativeViewportVisible && orbVisible,
      highlighted,
      mediaCount,
      sizeDp,
      settings.floatingButtonX || 0,
      settings.floatingButtonY || 0,
      desc
    );

    window.__salviaNativeFabTap = () => downloadMainMedia();
    window.__salviaNativeFabLongPress = () => openMediaTray();
    window.__salviaNativeFabMove = (xCss, yCss) => {
      updateSettings({ floatingButtonX: xCss, floatingButtonY: yCss });
    };
    return () => {
      delete window.__salviaNativeFabTap;
      delete window.__salviaNativeFabLongPress;
      delete window.__salviaNativeFabMove;
    };
  }, [
    isNativeBrowserEngine,
    nativeViewportVisible,
    currentTabCandidates.length,
    currentMainCandidate,
    settings.isFloatingButtonAlwaysVisible,
    settings.floatingButtonSize,
    settings.floatingButtonX,
    settings.floatingButtonY,
    downloadMainMedia,
    openMediaTray,
    updateSettings,
    t,
  ]);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const isBottomOmnibox = settings.omniboxPosition === 'bottom';

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFocused(false);
    navigateCurrentTab(addressInput);
  };

  const handleCopyUrl = async () => {
    if (!currentTab.url) return;
    await navigator.clipboard?.writeText(currentTab.url);
    showToast(t('link_copied'));
    setMenuOpen(false);
  };

  const handleSharePage = async () => {
    if (!currentTab.url) return;
    setMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTab.title || currentTab.url, url: currentTab.url });
        return;
      } catch {
        // fallback to copy
      }
    }
    await navigator.clipboard?.writeText(currentTab.url);
    showToast(t('link_copied'));
  };

  const renderOmniboxRow = () => (
    <div className="flex h-12 items-center gap-1 px-2 sm:h-14 sm:gap-1.5 sm:px-3">
      <button
        type="button"
        onClick={goBackCurrentTab}
        disabled={!canGoBack}
        aria-label={t('go_back')}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text)] disabled:opacity-30 hover:bg-[var(--salvia-elevated)] sm:flex"
      >
        <BackIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={goForwardCurrentTab}
        disabled={!canGoForward}
        aria-label={t('go_forward')}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text)] disabled:opacity-30 hover:bg-[var(--salvia-elevated)] sm:flex"
      >
        <ForwardIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={page?.isLoading ? stopLoadingCurrentTab : reloadCurrentTab}
        aria-label={page?.isLoading ? t('stop') : t('reload')}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)] sm:flex"
      >
        {page?.isLoading ? <X className="h-4 w-4" /> : <RotateCw className="h-4 w-4" />}
      </button>

      {/* Address / Search Omnibox */}
      <form onSubmit={submitAddress} className="relative flex min-w-0 flex-1 items-center">
        <div
          className={`flex h-11 w-full items-center gap-1 rounded-2xl border px-1.5 transition-colors duration-150 sm:h-10 sm:px-2 ${
            currentTab.isPrivate
              ? 'border-[var(--salvia-iris)]/55 bg-[var(--salvia-surface)] focus-within:border-[var(--salvia-iris)]'
              : 'border-[var(--salvia-border)] bg-[var(--salvia-surface)] focus-within:border-[var(--salvia-cyan)]'
          }`}
        >
          {/* Clickable Site Shield & Security Indicator */}
          <button
            type="button"
            data-testid="site-shield-trigger"
            onClick={() => setShieldOpen((prev) => !prev)}
            aria-label={t('site_shield_title')}
            title={
              isHttps
                ? t('connection_secure')
                : isHttp
                  ? t('connection_not_secure')
                  : t('site_shield_title')
            }
            className={`flex h-11 min-w-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-8 sm:min-w-8 ${
              isHttps
                ? 'text-[var(--salvia-cyan)] hover:bg-[var(--salvia-elevated)]'
                : isHttp
                  ? 'text-[var(--salvia-gold)] hover:bg-[var(--salvia-elevated)]'
                  : isShowcaseUrl
                    ? 'text-[var(--salvia-iris-light)] hover:bg-[var(--salvia-elevated)]'
                    : 'text-[var(--salvia-text-subtle)] hover:bg-[var(--salvia-elevated)]'
            }`}
          >
            {isHttps ? (
              <Lock className="h-3.5 w-3.5" />
            ) : isHttp ? (
              <Unlock className="h-3.5 w-3.5" />
            ) : isShowcaseUrl ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
          </button>

          <input
            ref={addressInputRef}
            type="text"
            value={addressInput}
            onFocus={() => setAddressFocused(true)}
            onBlur={() => window.setTimeout(() => setAddressFocused(false), 160)}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder={t('search_or_type_url')}
            dir="ltr"
            aria-label={t('search_or_type_url')}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--salvia-text)] placeholder-[var(--salvia-text-subtle)] outline-none sm:text-[14px]"
          />

          {addressInput ? (
            <button
              type="button"
              onClick={() => setAddressInput('')}
              aria-label={t('address_clear')}
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--salvia-text-subtle)] hover:text-[var(--salvia-text)] sm:h-8 sm:w-8"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {currentTab.url ? (
            <button
              type="button"
              onClick={toggleBookmarkForCurrentTab}
              aria-label={isCurrentTabBookmarked ? t('bookmark_remove') : t('bookmark_add')}
              title={isCurrentTabBookmarked ? t('bookmark_remove') : t('bookmark_add')}
              className={`flex h-11 w-10 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8 ${
                isCurrentTabBookmarked
                  ? 'text-[var(--salvia-gold)]'
                  : 'text-[var(--salvia-text-subtle)] hover:text-[var(--salvia-gold)]'
              }`}
            >
              {isCurrentTabBookmarked ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>

        {suggestions.length > 0 ? (
          <div
            className={`absolute right-0 left-0 z-40 overflow-hidden rounded-2xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] shadow-2xl ${
              isBottomOmnibox ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {suggestions.map((sug) => (
              <button
                key={sug.url}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setAddressInput(sug.url);
                  setAddressFocused(false);
                  navigateCurrentTab(sug.url);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-[var(--salvia-border)]/40 px-4 py-2.5 text-start last:border-none hover:bg-[var(--salvia-elevated)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--salvia-text)]">
                    {sug.title}
                  </p>
                  <p className="font-data truncate text-[11px] text-[var(--salvia-text-subtle)]">
                    {sug.url}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--salvia-cyan-text)]">
                  {sug.source}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </form>

      {/* Detected Media Tray Quick Trigger */}
      {currentTabCandidates.length > 0 ? (
        <button
          type="button"
          onClick={openMediaTray}
          aria-label={`${t('media_tray_title')} (${currentTabCandidates.length})`}
          title={t('media_detected', { count: currentTabCandidates.length })}
          className="font-data tabular-nums flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8F6BFF]/20 to-[#4CC4FF]/20 px-2.5 text-[12px] font-bold text-[var(--salvia-cyan-text)] ring-1 ring-[var(--salvia-cyan)]/50 hover:ring-[var(--salvia-cyan)] sm:h-10 sm:px-3"
        >
          <Film className="h-4 w-4 text-[var(--salvia-cyan)]" />
          <span>{currentTabCandidates.length}</span>
        </button>
      ) : null}

      {/* Extensions Quick Button (desktop) */}
      <button
        type="button"
        onClick={() => navigate('extensions')}
        title={t('extensions')}
        aria-label={t('extensions')}
        className="relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-iris)] md:flex"
      >
        <Puzzle className="h-4 w-4" />
        {enabledExtensionCount > 0 ? (
          <span className="font-data absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-[var(--salvia-cyan)]" />
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => navigateCurrentTab(addressInput)}
        aria-label={t('address_go')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] text-white hover:opacity-95 sm:h-10 sm:w-10"
      >
        <ForwardIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={t('menu')}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)] md:flex"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );

  const renderProgressAndBanners = () => (
    <>
      {page?.isLoading ? (
        <div className="h-[2px] w-full overflow-hidden bg-[var(--salvia-elevated)]">
          <div
            className="h-full bg-gradient-to-r from-[#8F6BFF] via-[#4CC4FF] to-[#D9AE54] transition-all duration-300"
            style={{ width: `${page.progress}%` }}
          />
        </div>
      ) : null}

      {findInPage ? (
        <div className="flex items-center gap-2 border-t border-[var(--salvia-border)]/60 bg-[var(--salvia-surface)] px-3 py-2">
          <input
            type="text"
            value={findInPage.query}
            onChange={(e) => sendFindToIframe(e.target.value, false)}
            placeholder={t('find_in_page_hint')}
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3 text-[13px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
          />
          <span className="font-data tabular-nums text-[12px] text-[var(--salvia-text-muted)]">
            {findInPage.matches > 0
              ? `${findInPage.activeMatch}/${findInPage.matches}`
              : t('find_no_matches')}
          </span>
          <button
            type="button"
            onClick={() => sendFindToIframe(findInPage.query, true)}
            aria-label={t('find_previous')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)]"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => sendFindToIframe(findInPage.query, false)}
            aria-label={t('find_next')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)]"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={closeFindInPage}
            aria-label={t('find_close')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {blockedCleartextUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--salvia-gold)]/45 bg-[var(--salvia-elevated)] px-4 py-2.5 text-[13px]">
          <p className="text-[var(--salvia-text)]">{t('error_cleartext_blocked')}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allowCleartextAndRetry}
              className="min-h-10 rounded-xl bg-[#D9AE54] px-3 text-[12px] font-bold text-[#000000]"
            >
              {t('action_allow')}
            </button>
            <button
              type="button"
              onClick={dismissCleartextBlock}
              className="min-h-10 rounded-xl px-2.5 text-[12px] font-semibold text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
            >
              {t('action_dismiss')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  const renderMobileThumbNavRow = () => (
    <div className="flex h-12 items-center justify-around px-2 md:hidden">
      <button
        type="button"
        onClick={goBackCurrentTab}
        disabled={!canGoBack}
        aria-label={t('go_back')}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text)] disabled:opacity-30"
      >
        <BackIcon className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={page?.isLoading ? stopLoadingCurrentTab : reloadCurrentTab}
        aria-label={page?.isLoading ? t('stop') : t('reload')}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)]"
      >
        {page?.isLoading ? <X className="h-5 w-5" /> : <RotateCw className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={() => navigate('home')}
        onDoubleClick={goHomeInCurrentTab}
        aria-label={t('home')}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#8F6BFF] to-[#4CC4FF] text-white shadow-[0_4px_14px_rgba(143,107,255,0.4)]"
      >
        <Home className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={openTabSwitcher}
        aria-label={t('tabs')}
        className="flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-[var(--salvia-text)]"
      >
        <span className="font-data tabular-nums flex h-6 min-w-6 items-center justify-center rounded-md border-2 border-[var(--salvia-text-muted)] px-1 text-[12px] font-bold">
          {tabs.length}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={t('menu')}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)]"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--salvia-bg)] text-[var(--salvia-text)]">
      <BrowserNavRail />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Desktop Interactive Tab Strip */}
        <div className="hidden h-10 items-center justify-between gap-2 border-b border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] px-2 md:flex">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const active = tab.id === currentTab.id;
              const sleeping = hibernatedTabIds.has(tab.id);
              const host = hostOfUrl(tab.url);
              const tabTitle = tab.title || host || (tab.isPrivate ? t('new_private_tab') : t('new_tab'));
              return (
                <div
                  key={tab.id}
                  className={`group relative flex h-8 max-w-[200px] min-w-[116px] shrink-0 items-center justify-between gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors duration-150 ${
                    active
                      ? 'bg-[var(--salvia-surface)] text-[var(--salvia-text)] ring-1 ring-[var(--salvia-iris)]/60 shadow-sm'
                      : 'text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-surface)]/70 hover:text-[var(--salvia-text)]'
                  }`}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 right-3 left-3 h-[2px] rounded-full bg-gradient-to-r from-[#8F6BFF] via-[#4CC4FF] to-[#D9AE54]"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
                  >
                    {tab.isPrivate ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--salvia-iris-light)]" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--salvia-cyan)]/80" />
                    )}
                    <span className="truncate font-medium">{tabTitle}</span>
                    {sleeping ? (
                      <span className="shrink-0 text-[10px] text-[var(--salvia-text-subtle)]">·</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeTab(tab.id)}
                    aria-label={`${t('close_tab')}: ${tabTitle}`}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--salvia-text-subtle)] opacity-75 hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)] hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => createTab({ isPrivate: false })}
              title={t('new_tab')}
              aria-label={t('new_tab')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-surface)] hover:text-[var(--salvia-cyan)]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => createTab({ isPrivate: true })}
              title={t('new_private_tab')}
              aria-label={t('new_private_tab')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-surface)] hover:text-[var(--salvia-iris-light)]"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={openTabSwitcher}
            title={t('tab_overview')}
            aria-label={t('tab_overview')}
            className="font-data tabular-nums flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--salvia-border)] bg-[var(--salvia-surface)] px-2.5 text-[11px] font-semibold text-[var(--salvia-text-muted)] hover:border-[var(--salvia-iris)] hover:text-[var(--salvia-text)]"
          >
            <Layers className="h-3.5 w-3.5 text-[var(--salvia-cyan)]" />
            <span>{tabs.length}</span>
          </button>
        </div>

        {/* Top Omnibox Header (when omniboxPosition === 'top') */}
        {!isBottomOmnibox ? (
          <header
            data-testid="browser-top-chrome"
            className="relative z-30 border-b border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]"
          >
            {renderOmniboxRow()}
            {renderProgressAndBanners()}
          </header>
        ) : null}

        {/* Browser Content Viewport */}
        <div ref={viewportRef} className="relative flex-1 overflow-y-auto bg-[var(--salvia-bg)]">
          {!currentTab.url ? (
            /* Empty New Tab Launch View */
            <div className="animate-salvia-fade-up mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
              <div className="relative mb-5 flex items-center justify-center">
                <OrbitalBrandMark size={84} showRing={false} />
              </div>

              <h2 className="font-display text-[22px] font-bold text-[var(--salvia-text)]">
                {currentTab.isPrivate ? t('private_browsing') : t('app_name')}
              </h2>
              <p className="mt-1.5 max-w-md text-[14px] text-[var(--salvia-text-muted)]">
                {currentTab.isPrivate ? t('private_tabs_disclosure') : t('brand_tagline')}
              </p>

              <div className="mt-7 w-full max-w-2xl space-y-4 text-start">
                <div className="rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-[var(--salvia-card-shadow)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-[var(--salvia-text)]">
                        {BUILTIN_SHOWCASE_PAGES[0].title}
                      </h3>
                      <p className="mt-1 text-[13px] text-[var(--salvia-text-muted)]">
                        {BUILTIN_SHOWCASE_PAGES[0].description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateCurrentTab(BUILTIN_SHOWCASE_PAGES[0].url)}
                      className="min-h-11 shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-5 text-[13px] font-semibold text-white hover:opacity-95"
                    >
                      {t('action_open')}
                    </button>
                  </div>
                </div>

                {bookmarks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {bookmarks.slice(0, 4).map((bm) => (
                      <button
                        key={bm.id}
                        type="button"
                        onClick={() => navigateCurrentTab(bm.url)}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] px-4 py-2.5 text-start hover:border-[var(--salvia-iris)]/70"
                      >
                        <span className="truncate text-[13px] font-medium text-[var(--salvia-text)]">
                          {bm.title}
                        </span>
                        <span className="font-data shrink-0 text-[11px] text-[var(--salvia-text-subtle)]">
                          {hostOfUrl(bm.url) || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : showcasePage ? (
            /* Built-in Interactive Media Showcase */
            <div
              className="animate-salvia-fade-up mx-auto max-w-5xl space-y-6 p-4 sm:p-6"
              style={pageZoom !== 100 ? { zoom: pageZoom / 100 } : undefined}
            >
              <div className="rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-[var(--salvia-card-shadow)] sm:p-6">
                <h2 className="font-display text-[20px] font-bold text-[var(--salvia-text)]">
                  {showcasePage.title}
                </h2>
                <p className="mt-1.5 text-[14px] text-[var(--salvia-text-muted)]">
                  {showcasePage.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {showcasePage.media.map((m, idx) => {
                  const candidate = currentTabCandidates[idx];
                  const isHls = m.extension === 'm3u8';
                  return (
                    <div
                      key={m.mediaUrl}
                      className="flex flex-col overflow-hidden rounded-3xl border border-[var(--salvia-border)]/80 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]"
                    >
                      <div className="relative aspect-video bg-[#070510]">
                        {!isHls ? (
                          <video
                            src={m.mediaUrl}
                            controls
                            preload="metadata"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2.5 p-4 text-center">
                            <Film className="h-10 w-10 text-[#4CC4FF]" />
                            <span className="text-[13px] font-semibold text-[#A8E6FF]">
                              HLS Adaptive Master Playlist (.m3u8)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                navigate('player', {
                                  player: {
                                    url: `/api/media/fetch?url=${encodeURIComponent(m.mediaUrl)}`,
                                    title: m.title,
                                    isHls: true,
                                  },
                                })
                              }
                              className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#18122E] px-4 text-[12px] font-semibold text-[#F4F2FF] ring-1 ring-[#312556] hover:ring-[#4CC4FF]"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              {t('download_open')}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                        <div>
                          <h3 className="text-[15px] font-bold text-[var(--salvia-text)]">
                            {m.title}
                          </h3>
                          <p className="font-data mt-1 text-[12px] text-[var(--salvia-text-muted)]">
                            {[
                              m.extension.toUpperCase(),
                              m.duration ? formatDurationSeconds(m.duration / 1000) : null,
                              m.estimatedSize ? formatFileSize(m.estimatedSize) : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>

                        {candidate ? (
                          <button
                            type="button"
                            onClick={() => openQualitySheetForCandidate(candidate)}
                            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-4 text-[13px] font-semibold text-white hover:opacity-95"
                          >
                            <Download className="h-4 w-4" />
                            <span>{t('media_open_quality')}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : page?.error ? (
            <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 text-center">
              <h3 className="font-display text-[18px] font-bold text-[var(--salvia-text)]">
                {t('error_page_load_failed')}
              </h3>
              <p className="mt-2 text-[14px] text-[var(--salvia-text-muted)]">{page.error}</p>
              <button
                type="button"
                onClick={reloadCurrentTab}
                className="mt-5 min-h-11 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-5 text-[14px] font-semibold text-white"
              >
                {t('reload')}
              </button>
            </div>
          ) : page?.html ? (
            <iframe
              ref={iframeRef}
              title={page.title || currentTab.url}
              srcDoc={page.html}
              onLoad={handleIframeLoad}
              sandbox={
                settings.isJavaScriptEnabled
                  ? 'allow-scripts allow-forms allow-popups'
                  : 'allow-forms'
              }
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-data text-[13px] text-[var(--salvia-text-muted)]">
              {currentTab.url}
            </div>
          )}

          {!nativeViewportVisible ? <FloatingDownloadButton containerRef={viewportRef} /> : null}
        </div>

        {/* Bottom Dock (Top mode: mobile 5-button dock; Bottom mode: unified omnibox + mobile nav) */}
        <footer
          data-testid="browser-bottom-chrome"
          className={`relative z-30 border-t border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] ${
            isBottomOmnibox ? '' : 'md:hidden'
          }`}
        >
          {isBottomOmnibox ? (
            <>
              {renderProgressAndBanners()}
              {renderOmniboxRow()}
            </>
          ) : null}
          {renderMobileThumbNavRow()}
        </footer>
      </div>

      {/* Site Shield & Per-Site Controls Popover */}
      <SiteShieldPopover
        isOpen={shieldOpen}
        onClose={() => setShieldOpen(false)}
        omniboxPosition={settings.omniboxPosition}
      />

      {/* 4-Column Thumb-Zone Browser Menu Sheet */}
      <BrowserMenuSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onTriggerDeepScan={() => {
          void rescanCurrentTabMedia(iframeRef.current);
        }}
        onCopyUrl={handleCopyUrl}
        onSharePage={handleSharePage}
      />
    </div>
  );
};
