import React, { useState } from 'react';
import {
  BatteryCharging,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  Lock,
  Monitor,
  Moon,
  Puzzle,
  RefreshCw,
  Shield,
  Sliders,
  Sun,
  Trash2,
} from 'lucide-react';
import { BrowserNavRail } from '../components/BrowserNavRail';
import { OrbitalBrandMark } from '../components/OrbitalBrandMark';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  APP_VERSION,
  LICENSE_URL,
  PRIVACY_POLICY_URL,
  SEARCH_ENGINE_OPTIONS,
  SOURCE_CODE_URL,
} from '../core/constants';
import { useApp } from '../store/AppContext';
import type { BatterySaverMode, LanguageMode, SearchEngineKey, ThemeMode } from '../types/models';

const ToggleRow: React.FC<{
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}> = ({ title, subtitle, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start last:border-none hover:bg-[var(--salvia-elevated)]/60"
  >
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-semibold text-[var(--salvia-text)]">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">{subtitle}</p> : null}
    </div>
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[var(--salvia-iris)]' : 'bg-[var(--salvia-border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
        }`}
      />
    </span>
  </button>
);

export const SettingsScreen: React.FC = () => {
  const {
    navigate,
    isRtl,
    t,
    settings,
    updateSettings,
    isBatterySaverActive,
    batteryLevel,
    liveTabLimit,
    enabledExtensionCount,
    clearHistory,
    clearCookiesAndStorage,
    clearAllBrowsingData,
    isLockedFolderConfigured,
    saveLockedFolderPassword,
    removeLockedFolderPasswordAction,
    connectionKind,
    updateCheck,
    checkForUpdates,
    dismissUpdateDialog,
    exportDiagnostics,
    showToast,
  } = useApp();

  const [engineModalOpen, setEngineModalOpen] = useState(false);
  const [homepageModalOpen, setHomepageModalOpen] = useState(false);
  const [homepageDraft, setHomepageDraft] = useState(settings.homepage);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const connectionReadout = (() => {
    if (connectionKind === 'WIFI') return t('settings_connection_wifi');
    if (connectionKind === 'MOBILE') return t('settings_connection_mobile');
    if (connectionKind === 'OFFLINE') return t('settings_connection_offline');
    return t('settings_connection_other');
  })();

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 4) {
      setPwError(t('locked_folder_password_short', { min: 4 }));
      return;
    }
    if (pw1 !== pw2) {
      setPwError(t('locked_folder_mismatch'));
      return;
    }
    const ok = await saveLockedFolderPassword(pw1);
    if (ok) {
      setPw1('');
      setPw2('');
      setPwError(null);
      setPasswordModalOpen(false);
    }
  };

  const ForwardArrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex min-h-screen bg-[var(--salvia-bg)] text-[var(--salvia-text)]">
      <BrowserNavRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title={t('settings')} onBack={() => navigate('home')} />

        <main className="animate-salvia-fade-up mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6">
          {/* Browser Section */}
          <section className="overflow-hidden rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]">
            <div className="border-b border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-4 py-3 text-[13px] font-bold text-[var(--salvia-cyan-text)]">
              {t('settings_browser')}
            </div>

            <button
              type="button"
              onClick={() => navigate('extensions')}
              className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--salvia-iris-soft)] text-[var(--salvia-iris)]">
                  <Puzzle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                    {t('settings_extensions_shortcut')}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                    {t('settings_extensions_shortcut_hint', { count: enabledExtensionCount })}
                  </p>
                </div>
              </div>
              <ForwardArrow className="h-4 w-4 shrink-0 text-[var(--salvia-text-subtle)]" />
            </button>

            <button
              type="button"
              onClick={() => setEngineModalOpen(true)}
              className="flex min-h-14 w-full items-center justify-between border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div>
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_search_engine')}
                </p>
                <p className="text-[12px] text-[var(--salvia-text-muted)]">{settings.searchEngine}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setHomepageDraft(settings.homepage);
                setHomepageModalOpen(true);
              }}
              className="flex min-h-14 w-full items-center justify-between border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_homepage')}
                </p>
                <p className="font-data truncate text-[12px] text-[var(--salvia-text-muted)]">
                  {settings.homepage}
                </p>
              </div>
            </button>

            <ToggleRow
              title={t('settings_desktop_site')}
              subtitle={t('settings_desktop_site_hint')}
              checked={settings.isDesktopSite}
              onChange={(v) => updateSettings({ isDesktopSite: v })}
            />
            <ToggleRow
              title={t('settings_javascript')}
              subtitle={t('settings_javascript_hint')}
              checked={settings.isJavaScriptEnabled}
              onChange={(v) => updateSettings({ isJavaScriptEnabled: v })}
            />
            <ToggleRow
              title={t('settings_cookies')}
              subtitle={t('settings_cookies_hint')}
              checked={settings.areCookiesEnabled}
              onChange={(v) => updateSettings({ areCookiesEnabled: v })}
            />

            {/* Language Picker */}
            <div className="flex flex-col gap-2.5 border-b border-[var(--salvia-border)]/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_language')}
                </p>
                <p className="text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_language_hint')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'system', label: t('language_system') },
                    { id: 'en', label: t('language_en') },
                    { id: 'fa', label: t('language_fa') },
                  ] as Array<{ id: LanguageMode; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSettings({ language: opt.id })}
                    className={`min-h-10 rounded-xl px-3.5 text-[12px] font-semibold transition-colors ${
                      settings.language === opt.id
                        ? 'bg-[var(--salvia-iris)] text-white'
                        : 'border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              className="flex min-h-14 w-full items-center justify-between px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div>
                <p className="text-[14px] font-semibold text-[var(--salvia-pink-text)]">
                  {t('settings_clear_browsing_data')}
                </p>
                <p className="text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_clear_browsing_data_hint')}
                </p>
              </div>
              <Trash2 className="h-4 w-4 text-[var(--salvia-pink)]" />
            </button>
          </section>

          {/* Appearance & Power Optimization Section */}
          <section className="overflow-hidden rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]">
            <div className="border-b border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-4 py-3 text-[13px] font-bold text-[var(--salvia-cyan-text)]">
              {t('settings_appearance')}
            </div>

            {/* Theme Selector */}
            <div className="flex flex-col gap-2.5 border-b border-[var(--salvia-border)]/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_theme')}
                </p>
                <p className="text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_theme_hint')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'system', label: t('theme_system'), icon: <Monitor className="h-3.5 w-3.5" /> },
                    { id: 'dark', label: t('theme_dark'), icon: <Moon className="h-3.5 w-3.5" /> },
                    { id: 'light', label: t('theme_light'), icon: <Sun className="h-3.5 w-3.5" /> },
                  ] as Array<{ id: ThemeMode; label: string; icon: React.ReactNode }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`theme-opt-${opt.id}`}
                    onClick={() => updateSettings({ theme: opt.id })}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-semibold transition-colors ${
                      settings.theme === opt.id
                        ? 'bg-[var(--salvia-iris)] text-white shadow-sm'
                        : 'border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Battery Optimization Mode */}
            <div className="flex flex-col gap-2.5 border-b border-[var(--salvia-border)]/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <BatteryCharging className="h-4 w-4 text-[var(--salvia-cyan)]" />
                  <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                    {t('settings_battery_saver')}
                  </p>
                  {isBatterySaverActive ? (
                    <span className="font-data rounded-lg bg-[var(--salvia-cyan-container)] px-2 py-0.5 text-[11px] font-bold text-[var(--salvia-cyan-text)]">
                      {t('battery_active_badge')} · {t('battery_live_tabs_cap', { count: liveTabLimit })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_battery_saver_hint')}
                  {batteryLevel !== null ? ` · ${Math.round(batteryLevel * 100)}%` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'off', label: t('battery_off') },
                    { id: 'auto', label: t('battery_auto') },
                    { id: 'on', label: t('battery_on') },
                  ] as Array<{ id: BatterySaverMode; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`battery-opt-${opt.id}`}
                    onClick={() => updateSettings({ batterySaver: opt.id })}
                    className={`min-h-10 rounded-xl px-3.5 text-[12px] font-semibold transition-colors ${
                      settings.batterySaver === opt.id
                        ? 'bg-[var(--salvia-iris)] text-white shadow-sm'
                        : 'border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              title={t('settings_floating_button_always')}
              subtitle={t('settings_floating_button_always_hint')}
              checked={settings.isFloatingButtonAlwaysVisible}
              onChange={(v) => updateSettings({ isFloatingButtonAlwaysVisible: v })}
            />

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="fab-size"
                  className="text-[14px] font-semibold text-[var(--salvia-text)]"
                >
                  {t('settings_floating_button_size')}
                </label>
                <span className="font-data text-[13px] font-semibold text-[var(--salvia-cyan-text)]">
                  {t('settings_dp_value', { size: settings.floatingButtonSize })}
                </span>
              </div>
              <input
                id="fab-size"
                type="range"
                min={44}
                max={76}
                value={settings.floatingButtonSize}
                onChange={(e) => updateSettings({ floatingButtonSize: Number(e.target.value) })}
                className="mt-2 h-1.5 w-full cursor-pointer accent-[#8F6BFF]"
              />
            </div>

            <button
              type="button"
              onClick={() => updateSettings({ floatingButtonX: 0, floatingButtonY: 0 })}
              className="flex min-h-14 w-full items-center justify-between px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div>
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_floating_button_position')}
                </p>
                <p className="text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_floating_button_position_hint')}
                </p>
              </div>
              <Sliders className="h-4 w-4 text-[var(--salvia-text-muted)]" />
            </button>
          </section>

          {/* Downloads Section */}
          <section className="overflow-hidden rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]">
            <div className="border-b border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-4 py-3 text-[13px] font-bold text-[var(--salvia-cyan-text)]">
              {t('settings_downloads')}
            </div>

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                {t('settings_download_directory')}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                {t('settings_download_directory_hint')}
              </p>
            </div>

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[var(--salvia-gold)]" />
                    <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                      {t('settings_locked_folder')}
                    </p>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--salvia-text-muted)]">
                    {isLockedFolderConfigured
                      ? t('settings_locked_folder_secured_note')
                      : t('settings_locked_folder_not_set')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPw1('');
                      setPw2('');
                      setPwError(null);
                      setPasswordModalOpen(true);
                    }}
                    className="min-h-10 rounded-xl bg-[var(--salvia-iris)] px-3.5 text-[12px] font-semibold text-white hover:bg-[var(--salvia-iris-deep)]"
                  >
                    {isLockedFolderConfigured
                      ? t('action_change_password')
                      : t('action_set_password')}
                  </button>
                  {isLockedFolderConfigured ? (
                    <button
                      type="button"
                      onClick={removeLockedFolderPasswordAction}
                      className="min-h-10 rounded-xl border border-[var(--salvia-pink)]/50 px-3.5 text-[12px] font-semibold text-[var(--salvia-pink-text)] hover:bg-[var(--salvia-pink-soft)]"
                    >
                      {t('action_remove_password')}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="simultaneous-dl"
                  className="text-[14px] font-semibold text-[var(--salvia-text)]"
                >
                  {t('settings_simultaneous_downloads')}
                </label>
                <span className="font-data text-[13px] font-semibold text-[var(--salvia-cyan-text)]">
                  {t('settings_downloads_at_a_time', { count: settings.maxSimultaneousDownloads })}
                </span>
              </div>
              <input
                id="simultaneous-dl"
                type="range"
                min={1}
                max={6}
                value={settings.maxSimultaneousDownloads}
                onChange={(e) =>
                  updateSettings({ maxSimultaneousDownloads: Number(e.target.value) })
                }
                className="mt-2 h-1.5 w-full cursor-pointer accent-[#8F6BFF]"
              />
            </div>

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="parallel-conn"
                  className="text-[14px] font-semibold text-[var(--salvia-text)]"
                >
                  {t('settings_parallel_connections')}
                </label>
                <span className="font-data text-[13px] font-semibold text-[var(--salvia-cyan-text)]">
                  {settings.parallelConnections}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                {t('settings_parallel_connections_hint')}
              </p>
              <input
                id="parallel-conn"
                type="range"
                min={1}
                max={8}
                value={settings.parallelConnections}
                onChange={(e) => updateSettings({ parallelConnections: Number(e.target.value) })}
                className="mt-2 h-1.5 w-full cursor-pointer accent-[#8F6BFF]"
              />
            </div>

            <ToggleRow
              title={t('settings_wifi_only')}
              subtitle={t('settings_wifi_only_hint')}
              checked={settings.isWifiOnly}
              onChange={(v) => updateSettings({ isWifiOnly: v })}
            />

            <div className="border-b border-[var(--salvia-border)]/50 px-4 py-3">
              <p className="text-[12px] font-semibold text-[var(--salvia-text-subtle)]">
                {t('settings_connection_label')}
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--salvia-cyan-text)]">{connectionReadout}</p>
            </div>

            <ToggleRow
              title={t('settings_ad_block')}
              subtitle={`${t('settings_ad_block_hint')} · ${t('settings_ad_block_stats', {
                blocked: settings.adBlockBlockedRequests,
                exempt: settings.adBlockDisabledSites.length,
              })}`}
              checked={settings.isAdBlockEnabled}
              onChange={(v) => updateSettings({ isAdBlockEnabled: v })}
            />

            <ToggleRow
              title={t('settings_export_to_gallery')}
              subtitle={t('settings_export_to_gallery_hint')}
              checked={settings.isExportToGallery}
              onChange={(v) => updateSettings({ isExportToGallery: v })}
            />
          </section>

          {/* Privacy Section */}
          <section className="overflow-hidden rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]">
            <div className="border-b border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-4 py-3 text-[13px] font-bold text-[var(--salvia-cyan-text)]">
              {t('settings_privacy')}
            </div>

            <ToggleRow
              title={t('settings_allow_cleartext')}
              subtitle={t('settings_allow_cleartext_hint')}
              checked={settings.isCleartextAllowed}
              onChange={(v) => updateSettings({ isCleartextAllowed: v })}
            />

            <button
              type="button"
              onClick={clearHistory}
              className="flex min-h-13 w-full items-center justify-between border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <span className="text-[14px] font-semibold text-[var(--salvia-text)]">
                {t('settings_clear_history')}
              </span>
              <Shield className="h-4 w-4 text-[var(--salvia-text-muted)]" />
            </button>

            <button
              type="button"
              onClick={clearCookiesAndStorage}
              className="flex min-h-13 w-full items-center justify-between px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <span className="text-[14px] font-semibold text-[var(--salvia-text)]">
                {t('settings_clear_cookies')}
              </span>
              <Trash2 className="h-4 w-4 text-[var(--salvia-text-muted)]" />
            </button>
          </section>

          {/* About & Diagnostics Section */}
          <section className="overflow-hidden rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]">
            <div className="border-b border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-4 py-3 text-[13px] font-bold text-[var(--salvia-cyan-text)]">
              {t('settings_about')}
            </div>

            <div className="flex items-center gap-4 border-b border-[var(--salvia-border)]/50 px-4 py-4">
              <OrbitalBrandMark size={46} />
              <div>
                <p className="font-display text-[15px] font-bold text-[var(--salvia-text)]">
                  {t('about_title')}
                </p>
                <p className="font-data text-[12px] text-[var(--salvia-text-muted)]">
                  {t('about_version', { version: APP_VERSION })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={checkForUpdates}
              disabled={updateCheck.isChecking}
              className="flex min-h-14 w-full items-center justify-between border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {updateCheck.isChecking ? t('update_checking') : t('settings_check_updates')}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_check_updates_hint')}
                </p>
              </div>
              <RefreshCw
                className={`h-4 w-4 shrink-0 text-[var(--salvia-cyan)] ${
                  updateCheck.isChecking ? 'animate-spin' : ''
                }`}
              />
            </button>

            <button
              type="button"
              onClick={exportDiagnostics}
              className="flex min-h-14 w-full items-center justify-between border-b border-[var(--salvia-border)]/50 px-4 py-3 text-start hover:bg-[var(--salvia-elevated)]/60"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--salvia-text)]">
                  {t('settings_share_diagnostics')}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                  {t('settings_share_diagnostics_hint')}
                </p>
              </div>
              <FileDown className="h-4 w-4 shrink-0 text-[var(--salvia-text-muted)]" />
            </button>

            <div className="flex flex-wrap gap-2 px-4 py-3.5">
              <a
                href={LICENSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[12px] font-semibold text-[var(--salvia-text)] hover:border-[var(--salvia-iris)]"
              >
                <span>{t('about_license')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--salvia-text-subtle)]" />
              </a>
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[12px] font-semibold text-[var(--salvia-text)] hover:border-[var(--salvia-iris)]"
              >
                <span>{t('about_privacy_policy')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--salvia-text-subtle)]" />
              </a>
              <a
                href={SOURCE_CODE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[12px] font-semibold text-[var(--salvia-text)] hover:border-[var(--salvia-iris)]"
              >
                <span>{t('about_source_code')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--salvia-text-subtle)]" />
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* Search Engine Modal */}
      {engineModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setEngineModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-sm space-y-2 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display mb-2 text-[16px] font-bold text-[var(--salvia-text)]">
              {t('settings_search_engine')}
            </h2>
            {SEARCH_ENGINE_OPTIONS.map((engine: SearchEngineKey) => (
              <button
                key={engine}
                type="button"
                onClick={() => {
                  updateSettings({ searchEngine: engine });
                  setEngineModalOpen(false);
                }}
                className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-[14px] text-[var(--salvia-text)] hover:bg-[var(--salvia-elevated)]"
              >
                <span>{engine}</span>
                {settings.searchEngine === engine ? (
                  <Check className="h-4 w-4 text-[var(--salvia-cyan)]" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Homepage Modal */}
      {homepageModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setHomepageModalOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettings({ homepage: homepageDraft.trim() || 'https://www.google.com' });
              setHomepageModalOpen(false);
              showToast(t('settings_homepage_updated'));
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-md space-y-4 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
              {t('settings_homepage')}
            </h2>
            <input
              type="url"
              value={homepageDraft}
              onChange={(e) => setHomepageDraft(e.target.value)}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHomepageModalOpen(false)}
                className="min-h-10 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('action_cancel')}
              </button>
              <button
                type="submit"
                className="min-h-10 rounded-xl bg-[var(--salvia-iris)] px-4 text-[13px] font-semibold text-white"
              >
                {t('action_ok')}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Clear Browsing Data Modal */}
      {clearModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setClearModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-sm space-y-4 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
              {t('settings_clear_browsing_data')}
            </h2>
            <p className="text-[14px] text-[var(--salvia-text-muted)]">
              {t('settings_clear_browsing_data_hint')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="min-h-10 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('action_cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllBrowsingData();
                  setClearModalOpen(false);
                }}
                className="min-h-10 rounded-xl bg-[var(--salvia-pink)] px-4 text-[13px] font-bold text-[#000000]"
              >
                {t('action_clear')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Password Modal */}
      {passwordModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setPasswordModalOpen(false)}
        >
          <form
            onSubmit={handleSavePassword}
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-sm space-y-3.5 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
              {t('settings_locked_folder')}
            </h2>
            <p className="text-[12px] text-[var(--salvia-text-muted)]">
              {t('settings_locked_folder_hint')}
            </p>
            <input
              type="password"
              value={pw1}
              onChange={(e) => {
                setPw1(e.target.value);
                setPwError(null);
              }}
              placeholder={t('locked_folder_password_label')}
              className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
            />
            <input
              type="password"
              value={pw2}
              onChange={(e) => {
                setPw2(e.target.value);
                setPwError(null);
              }}
              placeholder={t('locked_folder_confirm_label')}
              className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
            />
            {pwError ? (
              <p className="text-[12px] text-[var(--salvia-pink-text)]">{pwError}</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="min-h-10 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('action_cancel')}
              </button>
              <button
                type="submit"
                className="min-h-10 rounded-xl bg-[var(--salvia-iris)] px-4 text-[13px] font-semibold text-white"
              >
                {t('action_ok')}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Available Update Modal */}
      {updateCheck.availableVersion ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={dismissUpdateDialog}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in w-full max-w-md space-y-4 rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] p-5 shadow-2xl"
          >
            <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
              {t('update_available_title', { version: updateCheck.availableVersion })}
            </h2>
            {updateCheck.availableNotes ? (
              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[13px] text-[var(--salvia-text-muted)]">
                {updateCheck.availableNotes}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={dismissUpdateDialog}
                className="min-h-10 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)]"
              >
                {t('action_dismiss')}
              </button>
              {updateCheck.availableUrl ? (
                <a
                  href={updateCheck.availableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[var(--salvia-iris)] px-4 text-[13px] font-semibold text-white"
                >
                  <span>{t('update_open_page')}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
