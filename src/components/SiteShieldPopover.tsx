import React, { useEffect } from 'react';
import {
  Check,
  Eraser,
  Globe,
  Lock,
  Monitor,
  Moon,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { buildSiteShieldSummary } from '../core/siteShield';
import { useApp } from '../store/AppContext';

interface SiteShieldPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  omniboxPosition: 'top' | 'bottom';
}

export const SiteShieldPopover: React.FC<SiteShieldPopoverProps> = ({
  isOpen,
  onClose,
  omniboxPosition,
}) => {
  const {
    currentTab,
    settings,
    updateSettings,
    tabBlockedCounts,
    toggleAdBlockForCurrentSite,
    toggleExtension,
    clearSiteDataForHost,
    t,
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

  const summary = buildSiteShieldSummary({
    url: currentTab.url,
    isAdBlockEnabled: settings.isAdBlockEnabled,
    adBlockDisabledSites: settings.adBlockDisabledSites,
    tabBlockedCount: tabBlockedCounts[currentTab.id] || 0,
    totalBlockedCount: settings.adBlockBlockedRequests,
    enabledExtensionIds: settings.enabledExtensionIds,
    isDesktopSite: settings.isDesktopSite,
    isJavaScriptEnabled: settings.isJavaScriptEnabled,
  });

  const handleToggleSiteAdBlock = () => {
    if (!summary.host) {
      updateSettings({ isAdBlockEnabled: !settings.isAdBlockEnabled });
      return;
    }
    if (!settings.isAdBlockEnabled) {
      updateSettings({
        isAdBlockEnabled: true,
        adBlockDisabledSites: settings.adBlockDisabledSites.filter((h) => h !== summary.host),
      });
      return;
    }
    toggleAdBlockForCurrentSite();
  };

  const securityIcon =
    summary.security === 'HTTPS' ? (
      <Lock className="h-4 w-4 shrink-0 text-[var(--salvia-cyan)]" />
    ) : summary.security === 'HTTP' ? (
      <Unlock className="h-4 w-4 shrink-0 text-[var(--salvia-gold)]" />
    ) : summary.security === 'SHOWCASE' ? (
      <Sparkles className="h-4 w-4 shrink-0 text-[var(--salvia-iris-light)]" />
    ) : (
      <Globe className="h-4 w-4 shrink-0 text-[var(--salvia-text-muted)]" />
    );

  const securityText =
    summary.security === 'HTTPS'
      ? t('connection_secure')
      : summary.security === 'HTTP'
        ? t('connection_not_secure')
        : summary.security === 'SHOWCASE'
          ? t('site_shield_local_showcase')
          : t('home_start_screen');

  const shieldStatusText = !summary.isAdBlockEnabled
    ? t('site_shield_off')
    : summary.isSiteExempt
      ? t('site_shield_exempt')
      : t('site_shield_active');

  const positionClass =
    omniboxPosition === 'bottom'
      ? 'bottom-28 start-3 end-3 sm:start-6 sm:end-auto md:bottom-16'
      : 'top-14 start-3 end-3 sm:start-6 sm:end-auto md:top-24';

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--salvia-overlay)]/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('site_shield_title')}
        data-testid="site-shield-popover"
        onClick={(e) => e.stopPropagation()}
        className={`animate-salvia-menu-in absolute ${positionClass} max-h-[80vh] w-auto overflow-y-auto rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-4 shadow-2xl sm:w-[348px]`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--salvia-border)]/60 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--salvia-cyan-text)]">
              {t('site_shield_title')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {securityIcon}
              <h3 className="truncate font-data text-[14px] font-bold text-[var(--salvia-text)]">
                {summary.host || t('app_name')}
              </h3>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">{securityText}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('action_dismiss')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clean Unboxed Tabular Stats */}
        <div className="grid grid-cols-2 gap-3 border-b border-[var(--salvia-border)]/60 py-3">
          <div>
            <p className="text-[11px] text-[var(--salvia-text-subtle)]">
              {t('site_shield_ads_this_page')}
            </p>
            <p className="font-data tabular-nums text-[20px] font-bold text-[var(--salvia-cyan-text)]">
              {summary.tabBlockedCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--salvia-text-subtle)]">
              {t('site_shield_ads_total')}
            </p>
            <p className="font-data tabular-nums text-[20px] font-bold text-[var(--salvia-text)]">
              {summary.totalBlockedCount}
            </p>
          </div>
        </div>

        {/* Site & Privacy Controls */}
        <div className="divide-y divide-[var(--salvia-border)]/50 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={summary.isAdBlockEnabled && !summary.isSiteExempt}
            data-testid="shield-toggle-adblock"
            onClick={handleToggleSiteAdBlock}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-start hover:opacity-90"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {summary.isAdBlockEnabled && !summary.isSiteExempt ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--salvia-cyan)]" />
              ) : (
                <ShieldOff className="h-4 w-4 shrink-0 text-[var(--salvia-pink)]" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_ad_block')}
                </span>
                <span className="block truncate text-[11px] text-[var(--salvia-text-muted)]">
                  {shieldStatusText}
                </span>
              </span>
            </span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                summary.isAdBlockEnabled && !summary.isSiteExempt
                  ? 'bg-[var(--salvia-cyan)]'
                  : 'bg-[var(--salvia-border-strong)]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  summary.isAdBlockEnabled && !summary.isSiteExempt
                    ? 'translate-x-5 rtl:-translate-x-5'
                    : 'translate-x-0.5 rtl:-translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={summary.isNightWebActive}
            data-testid="shield-toggle-night-web"
            onClick={() => toggleExtension('force-dark-web')}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-start"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--salvia-text)]">
              <Moon className="h-4 w-4 text-[var(--salvia-iris-light)]" />
              <span>{t('site_shield_night_web')}</span>
            </span>
            <span
              className={`text-[12px] font-bold ${
                summary.isNightWebActive ? 'text-[var(--salvia-cyan-text)]' : 'text-[var(--salvia-text-subtle)]'
              }`}
            >
              {summary.isNightWebActive ? <Check className="h-4 w-4" /> : '—'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={summary.isReaderModeActive}
            data-testid="shield-toggle-reader-mode"
            onClick={() => toggleExtension('reader-focus-mode')}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-start"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--salvia-text)]">
              <Eraser className="h-4 w-4 text-[var(--salvia-gold)]" />
              <span>{t('site_shield_reader_mode')}</span>
            </span>
            <span
              className={`text-[12px] font-bold ${
                summary.isReaderModeActive ? 'text-[var(--salvia-cyan-text)]' : 'text-[var(--salvia-text-subtle)]'
              }`}
            >
              {summary.isReaderModeActive ? <Check className="h-4 w-4" /> : '—'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={summary.isDesktopSite}
            data-testid="shield-toggle-desktop"
            onClick={() => updateSettings({ isDesktopSite: !settings.isDesktopSite })}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-start"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--salvia-text)]">
              <Monitor className="h-4 w-4 text-[var(--salvia-text-muted)]" />
              <span>{t('desktop_site')}</span>
            </span>
            <span
              className={`text-[12px] font-bold ${
                summary.isDesktopSite ? 'text-[var(--salvia-cyan-text)]' : 'text-[var(--salvia-text-subtle)]'
              }`}
            >
              {summary.isDesktopSite ? <Check className="h-4 w-4" /> : '—'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={summary.isJavaScriptEnabled}
            data-testid="shield-toggle-js"
            onClick={() => updateSettings({ isJavaScriptEnabled: !settings.isJavaScriptEnabled })}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-start"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--salvia-text)]">
              <span className="font-data inline-flex h-4 w-4 items-center justify-center text-[11px] font-bold text-[var(--salvia-cyan)]">
                JS
              </span>
              <span>{t('settings_javascript')}</span>
            </span>
            <span
              className={`text-[12px] font-bold ${
                summary.isJavaScriptEnabled ? 'text-[var(--salvia-cyan-text)]' : 'text-[var(--salvia-pink-text)]'
              }`}
            >
              {summary.isJavaScriptEnabled ? <Check className="h-4 w-4" /> : 'OFF'}
            </span>
          </button>
        </div>

        {summary.host ? (
          <div className="mt-2 border-t border-[var(--salvia-border)]/60 pt-2.5">
            <button
              type="button"
              onClick={() => {
                clearSiteDataForHost(summary.host);
                onClose();
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--salvia-pink)]/40 bg-[var(--salvia-pink-soft)] px-3 text-[13px] font-semibold text-[var(--salvia-pink-text)] hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('site_shield_clear_site')}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
