import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Code2,
  Gauge,
  Moon,
  Plus,
  Puzzle,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { BrowserNavRail } from '../components/BrowserNavRail';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../store/AppContext';
import type { BrowserExtension } from '../types/models';

export const ExtensionsScreen: React.FC = () => {
  const {
    navigate,
    locale,
    t,
    settings,
    allExtensions,
    enabledExtensionCount,
    toggleExtension,
    addCustomExtension,
    deleteCustomExtension,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matchHostsRaw, setMatchHostsRaw] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const enabledSet = useMemo(
    () => new Set(settings.enabledExtensionIds),
    [settings.enabledExtensionIds]
  );

  const builtInList = useMemo(
    () => allExtensions.filter((e) => e.isBuiltIn),
    [allExtensions]
  );
  const customList = useMemo(
    () => allExtensions.filter((e) => !e.isBuiltIn),
    [allExtensions]
  );

  const categoryIcon = (cat: BrowserExtension['category']) => {
    switch (cat) {
      case 'privacy':
        return <Shield className="h-5 w-5 text-[var(--salvia-cyan)]" />;
      case 'media':
        return <Gauge className="h-5 w-5 text-[var(--salvia-gold)]" />;
      case 'appearance':
        return <Moon className="h-5 w-5 text-[var(--salvia-iris)]" />;
      case 'reading':
        return <BookOpen className="h-5 w-5 text-[var(--salvia-cyan-text)]" />;
      case 'custom':
      default:
        return <Code2 className="h-5 w-5 text-[var(--salvia-pink)]" />;
    }
  };

  const categoryLabel = (cat: BrowserExtension['category']) => {
    switch (cat) {
      case 'privacy':
        return t('extensions_cat_privacy');
      case 'media':
        return t('extensions_cat_media');
      case 'appearance':
        return t('extensions_cat_appearance');
      case 'reading':
        return t('extensions_cat_reading');
      case 'custom':
      default:
        return t('extensions_cat_custom');
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const matchHosts = matchHostsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = addCustomExtension({
      name,
      description,
      css: cssCode,
      js: jsCode,
      matchHosts,
    });
    if (!res.ok) {
      setFormError(res.error || 'Invalid input');
      return;
    }
    setName('');
    setDescription('');
    setMatchHostsRaw('');
    setCssCode('');
    setJsCode('');
    setFormError(null);
    setModalOpen(false);
  };

  const renderCard = (ext: BrowserExtension) => {
    const enabled = enabledSet.has(ext.id);
    const displayName = locale === 'fa' && ext.nameFa ? ext.nameFa : ext.name;
    const displayDesc = locale === 'fa' && ext.descriptionFa ? ext.descriptionFa : ext.description;

    return (
      <article
        key={ext.id}
        className={`animate-salvia-fade-up flex flex-col justify-between gap-3 rounded-3xl border p-4 transition-colors duration-150 ${
          enabled
            ? 'border-[var(--salvia-iris)]/70 bg-[var(--salvia-surface)] shadow-[var(--salvia-card-shadow)]'
            : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)]/80 opacity-85'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--salvia-elevated)] ring-1 ring-[var(--salvia-border)]/60">
              {categoryIcon(ext.category)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold text-[var(--salvia-text)]">
                  {displayName}
                </h3>
                <span className="font-data text-[11px] font-semibold text-[var(--salvia-text-subtle)]">
                  v{ext.version}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--salvia-text-muted)]">
                {displayDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={displayName}
            onClick={() => toggleExtension(ext.id)}
            className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              enabled ? 'bg-[var(--salvia-iris)]' : 'bg-[var(--salvia-border-strong)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--salvia-border)]/45 pt-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--salvia-text-subtle)]">
            <span className="rounded-lg bg-[var(--salvia-surface-muted)] px-2 py-0.5 text-[var(--salvia-iris-light)]">
              {categoryLabel(ext.category)}
            </span>
            <span>{ext.permissions.slice(0, 2).join(' · ')}</span>
            {ext.matchHosts && ext.matchHosts.length > 0 ? (
              <span className="font-data text-[var(--salvia-cyan-text)]">
                {ext.matchHosts.join(', ')}
              </span>
            ) : null}
          </div>

          {!ext.isBuiltIn ? (
            <button
              type="button"
              onClick={() => deleteCustomExtension(ext.id)}
              aria-label={`${t('action_delete')} ${displayName}`}
              className="flex h-8 items-center gap-1 rounded-xl px-2.5 text-[12px] font-semibold text-[var(--salvia-pink-text)] hover:bg-[var(--salvia-elevated)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('action_delete')}</span>
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className="flex min-h-screen bg-[var(--salvia-bg)] text-[var(--salvia-text)]">
      <BrowserNavRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader
          title={t('extensions_title')}
          onBack={() => navigate('home')}
          actions={
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-3.5 text-[13px] font-semibold text-white shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              <span>{t('extensions_add_custom')}</span>
            </button>
          }
        />

        <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6">
          {/* Summary Header Card */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--salvia-border)]/70 bg-[var(--salvia-surface)] p-5 shadow-[var(--salvia-card-shadow)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--salvia-iris-soft)] text-[var(--salvia-iris)]">
                <Puzzle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-[var(--salvia-text)]">
                  {t('extensions_title')}
                </h2>
                <p className="mt-0.5 text-[13px] text-[var(--salvia-text-muted)]">
                  {t('extensions_subtitle')}
                </p>
              </div>
            </div>
            <span className="font-data rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-surface-muted)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--salvia-cyan-text)]">
              {t('extensions_active_count', { count: enabledExtensionCount })}
            </span>
          </section>

          {/* Built-in Extensions */}
          <section className="space-y-3">
            <h2 className="font-display text-[15px] font-bold text-[var(--salvia-text)]">
              {t('extensions_builtin')}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {builtInList.map(renderCard)}
            </div>
          </section>

          {/* Custom Userscripts & CSS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold text-[var(--salvia-text)]">
                {t('extensions_custom')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setModalOpen(true);
                }}
                className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] px-3 text-[12px] font-semibold text-[var(--salvia-iris)] hover:border-[var(--salvia-iris)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('extensions_add_custom')}</span>
              </button>
            </div>

            {customList.length === 0 ? (
              <div className="rounded-3xl border border-[var(--salvia-border)]/60 bg-[var(--salvia-deep-cosmic)] px-6 py-10 text-center text-[13px] text-[var(--salvia-text-muted)]">
                {t('extensions_custom_empty')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {customList.map(renderCard)}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Add Custom Script / CSS Modal */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--salvia-overlay)] p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCustom}
            onClick={(e) => e.stopPropagation()}
            className="animate-salvia-sheet-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--salvia-border)]/60 px-5 py-4">
              <h2 className="font-display text-[16px] font-bold text-[var(--salvia-text)]">
                {t('extensions_add_custom')}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label={t('action_cancel')}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]">
                  {t('extensions_name_label')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={t('extensions_name_placeholder')}
                  className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]">
                  {t('extensions_desc_label')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('extensions_desc_placeholder')}
                  className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]">
                  {t('extensions_hosts_label')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={matchHostsRaw}
                  onChange={(e) => setMatchHostsRaw(e.target.value)}
                  placeholder={t('extensions_hosts_placeholder')}
                  className="font-data h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[13px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]">
                  {t('extensions_css_label')}
                </label>
                <textarea
                  rows={3}
                  dir="ltr"
                  value={cssCode}
                  onChange={(e) => {
                    setCssCode(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="body { font-size: 17px !important; }"
                  className="font-data w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] p-3 text-[12px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[var(--salvia-text-muted)]">
                  {t('extensions_js_label')}
                </label>
                <textarea
                  rows={3}
                  dir="ltr"
                  value={jsCode}
                  onChange={(e) => {
                    setJsCode(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="console.debug('Salvia userscript active');"
                  className="font-data w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] p-3 text-[12px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              {formError ? (
                <p className="text-[12px] font-medium text-[var(--salvia-pink-text)]">
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--salvia-border)]/60 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-10 rounded-xl px-4 text-[13px] font-semibold text-[var(--salvia-text-muted)] hover:text-[var(--salvia-text)]"
              >
                {t('action_cancel')}
              </button>
              <button
                type="submit"
                className="min-h-10 rounded-xl bg-gradient-to-r from-[#8F6BFF] to-[#5A34D9] px-5 text-[13px] font-semibold text-white hover:opacity-95"
              >
                {t('extensions_save_cta')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
