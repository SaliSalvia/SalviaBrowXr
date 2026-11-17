import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Check,
  Download,
  Film,
  ListVideo,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { hostOfUrl } from '../core/adBlockRules';
import { unsupportedReasonFor, type UnsupportedMedia } from '../core/mediaOfferability';
import { formatDurationSeconds, formatFileSize } from '../core/mediaResolver';
import { useApp } from '../store/AppContext';
import type { MediaCandidate } from '../types/models';

export const MediaTraySheet: React.FC = () => {
  const {
    isMediaTrayVisible,
    closeMediaTray,
    rankedTabCandidates,
    currentMainCandidate,
    openQualitySheetForCandidate,
    startBatchDownloadFromCandidates,
    isScanningMedia,
    rescanCurrentTabMedia,
    t,
  } = useApp();

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const wasOpenRef = useRef(false);

  const offerableRanked = useMemo(
    () =>
      rankedTabCandidates.filter(
        ({ candidate }) =>
          unsupportedReasonFor({
            url: candidate.mediaUrl,
            mimeType: candidate.mimeType,
            extension: candidate.extension,
            isLive: candidate.isLive,
            isMediaSource: candidate.isMediaSource,
            isBlobFile: candidate.isBlobFile,
            dashIsSupported: true,
          }) === null
      ),
    [rankedTabCandidates]
  );

  // Pre-check only the smart Main Video when the sheet opens (leaving 5s ads & suggested unchecked)
  useEffect(() => {
    if (!isMediaTrayVisible) {
      wasOpenRef.current = false;
      setIsConfirming(false);
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    if (currentMainCandidate) {
      setSelectedUrls(new Set([currentMainCandidate.mediaUrl]));
    } else if (offerableRanked.length > 0 && offerableRanked[0].role !== 'AD') {
      setSelectedUrls(new Set([offerableRanked[0].candidate.mediaUrl]));
    } else {
      setSelectedUrls(new Set());
    }
  }, [isMediaTrayVisible, currentMainCandidate, offerableRanked]);

  useEffect(() => {
    if (!isMediaTrayVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMediaTray();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMediaTrayVisible, closeMediaTray]);

  if (!isMediaTrayVisible) return null;

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const nonAdUrls = offerableRanked.filter((r) => r.role !== 'AD').map((r) => r.candidate.mediaUrl);
  const allNonAdSelected = nonAdUrls.length > 0 && nonAdUrls.every((u) => selectedUrls.has(u));

  const toggleSelectAll = () => {
    if (allNonAdSelected) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(nonAdUrls));
    }
  };

  const checkedCandidates = offerableRanked
    .filter(({ candidate }) => selectedUrls.has(candidate.mediaUrl))
    .map(({ candidate }) => candidate);

  const handleConfirmBatch = async () => {
    if (checkedCandidates.length === 0 || isConfirming) return;
    setIsConfirming(true);
    try {
      await startBatchDownloadFromCandidates(checkedCandidates);
    } finally {
      setIsConfirming(false);
    }
  };

  const refusalMessage = (reason: UnsupportedMedia | null): string | null => {
    if (reason === 'DASH') return t('error_dash_unsupported');
    if (reason === 'LIVE') return t('error_live_unsupported');
    if (reason === 'BLOB_STREAM') return t('error_blob_stream_unsupported');
    return null;
  };

  const renderIcon = (candidate: MediaCandidate) => {
    const ext = (candidate.extension || '').toLowerCase();
    const mime = (candidate.mimeType || '').toLowerCase();
    if (ext === 'm3u8' || ext === 'mpd' || mime.includes('mpegurl')) {
      return <ListVideo className="h-5 w-5 text-[var(--salvia-cyan)]" />;
    }
    if (mime.startsWith('audio/') || ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'wav'].includes(ext)) {
      return <AudioLines className="h-5 w-5 text-[var(--salvia-gold)]" />;
    }
    return <Film className="h-5 w-5 text-[var(--salvia-iris)]" />;
  };

  const mediaKindLabel = (candidate: MediaCandidate) => {
    const ext = (candidate.extension || '').toLowerCase();
    const mime = (candidate.mimeType || '').toLowerCase();
    if (ext === 'm3u8' || ext === 'mpd' || mime.includes('mpegurl')) return t('media_kind_playlist');
    if (mime.startsWith('audio/') || ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'wav'].includes(ext)) {
      return t('media_kind_audio');
    }
    return t('media_kind_video');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--salvia-overlay)] p-0 sm:items-center sm:p-4 backdrop-blur-sm"
      onClick={closeMediaTray}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('media_tray_title')}
        data-testid="media-tray-sheet"
        onClick={(e) => e.stopPropagation()}
        className="animate-salvia-sheet-in flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] sm:rounded-3xl shadow-2xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--salvia-border)] sm:hidden" />

        <div className="flex items-center justify-between gap-2 border-b border-[var(--salvia-border)]/70 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-bold text-[var(--salvia-text)]">
              {t('media_tray_title')}
            </h2>
            <p className="font-data tabular-nums mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
              {t('media_tray_count', { count: rankedTabCandidates.length })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="media-deep-scan-btn"
              disabled={isScanningMedia}
              onClick={() => void rescanCurrentTabMedia()}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-elevated)] px-3 text-[12px] font-semibold text-[var(--salvia-iris-light)] hover:border-[var(--salvia-iris)] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningMedia ? 'animate-spin' : ''}`} />
              <span>{isScanningMedia ? t('media_deep_scanning') : t('media_deep_scan')}</span>
            </button>
            {nonAdUrls.length > 1 ? (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="min-h-11 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-elevated)] px-3 text-[12px] font-semibold text-[var(--salvia-cyan-text)] hover:border-[var(--salvia-cyan)]/60"
              >
                {t('media_select_all')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeMediaTray}
              aria-label={t('action_dismiss')}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] transition-colors hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4 sm:p-5">
          {rankedTabCandidates.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-[var(--salvia-text-muted)]">
              {t('media_tray_empty')}
            </p>
          ) : (
            rankedTabCandidates.map(({ candidate, role }) => {
              const reason = unsupportedReasonFor({
                url: candidate.mediaUrl,
                mimeType: candidate.mimeType,
                extension: candidate.extension,
                isLive: candidate.isLive,
                isMediaSource: candidate.isMediaSource,
                isBlobFile: candidate.isBlobFile,
                dashIsSupported: true,
              });
              const note = refusalMessage(reason);
              const isOfferable = reason === null;
              const isChecked = isOfferable && selectedUrls.has(candidate.mediaUrl);
              const host = hostOfUrl(candidate.mediaUrl) || '';
              const metaParts = [
                mediaKindLabel(candidate),
                candidate.extension ? candidate.extension.toUpperCase() : null,
                candidate.width && candidate.height ? `${candidate.height}p` : null,
                candidate.duration ? formatDurationSeconds(candidate.duration / 1000) : null,
                candidate.estimatedSize ? formatFileSize(candidate.estimatedSize) : null,
                host || null,
              ].filter(Boolean);

              const roleLabel =
                role === 'MAIN' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--salvia-cyan-text)]">
                    <Sparkles className="h-3 w-3 text-[var(--salvia-cyan)]" />
                    {t('media_role_main')}
                  </span>
                ) : role === 'AD' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--salvia-pink-text)]">
                    <ShieldAlert className="h-3 w-3" />
                    {t('media_role_ad')}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[var(--salvia-text-subtle)]">
                    {t('media_role_suggested')}
                  </span>
                );

              const displayTitle =
                candidate.title ||
                candidate.mediaUrl.split('/').pop()?.split('?')[0] ||
                t('media_fallback_title');

              return (
                <div
                  key={candidate.id}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-colors ${
                    isChecked
                      ? role === 'MAIN'
                        ? 'border-[var(--salvia-cyan)]/70 bg-[var(--salvia-elevated)] ring-1 ring-[var(--salvia-iris)]/40'
                        : 'border-[var(--salvia-iris)]/70 bg-[var(--salvia-elevated)]'
                      : role === 'AD'
                        ? 'border-[var(--salvia-border)]/45 bg-[var(--salvia-deep-cosmic)]/60 opacity-70'
                        : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/80'
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    aria-label={displayTitle}
                    disabled={!isOfferable}
                    onClick={() => isOfferable && toggleUrl(candidate.mediaUrl)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-start disabled:cursor-not-allowed"
                  >
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isChecked
                          ? 'border-[var(--salvia-cyan)] bg-gradient-to-br from-[#8F6BFF] to-[#4CC4FF] text-white shadow-sm'
                          : 'border-[var(--salvia-border)] bg-[var(--salvia-surface)] text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>

                    <div className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--salvia-elevated)] ring-1 ring-[var(--salvia-border)]/70 sm:flex">
                      {renderIcon(candidate)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-1.5">{roleLabel}</div>
                      <p className="truncate text-[14px] font-semibold text-[var(--salvia-text)]">
                        {displayTitle}
                      </p>
                      <p className="font-data tabular-nums mt-0.5 truncate text-[12px] text-[var(--salvia-text-muted)]">
                        {metaParts.join(' · ')}
                      </p>
                      {note ? (
                        <p className="mt-1 text-[12px] text-[var(--salvia-pink-text)]">{note}</p>
                      ) : null}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openQualitySheetForCandidate(candidate)}
                    title={t('media_open_quality')}
                    aria-label={`${t('media_open_quality')}: ${displayTitle}`}
                    className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-elevated)] px-3 text-[12px] font-semibold text-[var(--salvia-iris-light)] transition-colors hover:border-[var(--salvia-iris)] hover:text-[var(--salvia-text)]"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('media_open_quality')}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {offerableRanked.length > 0 ? (
          <div className="border-t border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] p-4 sm:px-5">
            <button
              type="button"
              disabled={checkedCandidates.length === 0 || isConfirming}
              onClick={handleConfirmBatch}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8F6BFF] to-[#4CC4FF] px-5 text-[15px] font-bold text-white shadow-lg transition-opacity hover:opacity-95 disabled:opacity-40"
            >
              <Download className="h-5 w-5" />
              <span>{t('confirm_download_selected', { count: checkedCandidates.length })}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
