import React, { useEffect, useState } from 'react';
import { Check, CircleDot, Download, Film, Square, X } from 'lucide-react';
import { formatBitrateKbps, formatDurationSeconds, formatFileSize, sanitizeFilename } from '../core/mediaResolver';
import { useApp } from '../store/AppContext';
import type { MediaFormat } from '../types/models';

export const MediaQualitySelectionSheet: React.FC = () => {
  const {
    qualitySheet,
    closeQualitySheet,
    startDownloadFromFormat,
    recording,
    startRecordingPlayback,
    stopRecordingPlayback,
    t,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    if (!qualitySheet) return;
    const allFormats = [
      ...qualitySheet.mediaInfo.formats,
      ...qualitySheet.mediaInfo.audioFormats.filter(
        (af) => !qualitySheet.mediaInfo.formats.some((vf) => vf.id === af.id)
      ),
    ];
    setSelectedId((prev) => (allFormats.some((f) => f.id === prev) ? prev : allFormats[0]?.id || ''));
    setFileName((prev) => prev || sanitizeFilename(qualitySheet.mediaInfo.title));
  }, [qualitySheet]);

  useEffect(() => {
    if (!qualitySheet) {
      setFileName('');
      setSelectedId('');
    }
  }, [qualitySheet]);

  useEffect(() => {
    if (!qualitySheet) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQualitySheet();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [qualitySheet, closeQualitySheet]);

  if (!qualitySheet) return null;

  const { mediaInfo, isResolving, unsupported, canRecord } = qualitySheet;
  const videoFormats: MediaFormat[] = mediaInfo.formats;
  const audioFormats: MediaFormat[] = mediaInfo.audioFormats.filter(
    (af) => !videoFormats.some((vf) => vf.id === af.id)
  );
  const formats: MediaFormat[] = [...videoFormats, ...audioFormats];
  const selectedFormat = formats.find((f) => f.id === selectedId) || formats[0] || null;

  const unsupportedText = (() => {
    if (unsupported === 'DASH') return t('error_dash_unsupported');
    if (unsupported === 'LIVE') return t('error_live_unsupported');
    if (unsupported === 'DRM') return t('error_drm_protected');
    if (unsupported === 'BLOB_STREAM') return t('error_blob_stream_unsupported');
    return null;
  })();

  const formatLineMeta = (f: MediaFormat): string => {
    const parts: string[] = [
      f.isHls ? 'HLS' : f.isDash ? 'DASH' : null,
      f.extension.toUpperCase(),
      f.width && f.height ? `${f.width}×${f.height}` : null,
      formatBitrateKbps(f.bitrate),
      f.size && f.size > 0 ? formatFileSize(f.size) : t('error_size_unavailable'),
    ].filter((item): item is string => Boolean(item));
    return parts.join(' · ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--salvia-overlay)] p-0 sm:items-center sm:p-4 backdrop-blur-sm"
      onClick={closeQualitySheet}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('select_quality')}
        onClick={(e) => e.stopPropagation()}
        className="animate-salvia-sheet-in flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[var(--salvia-border)] bg-[var(--salvia-surface)] sm:rounded-3xl shadow-2xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--salvia-border)] sm:hidden" />

        <div className="flex items-start justify-between gap-3 border-b border-[var(--salvia-border)]/70 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {mediaInfo.thumbnail ? (
              <img
                src={mediaInfo.thumbnail}
                alt={mediaInfo.title}
                referrerPolicy="no-referrer"
                className="h-12 w-16 shrink-0 rounded-xl bg-[var(--salvia-deep-cosmic)] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--salvia-elevated)] text-[var(--salvia-iris)] ring-1 ring-[var(--salvia-border)]">
                <Film className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display truncate text-[16px] font-bold text-[var(--salvia-text)]">
                {mediaInfo.title || t('media_fallback_title')}
              </h2>
              <p className="font-data mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                {[
                  mediaInfo.duration ? formatDurationSeconds(mediaInfo.duration / 1000) : null,
                  isResolving ? t('quality_checking') : t('quality_options', { count: formats.length }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeQualitySheet}
            aria-label={t('action_dismiss')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text-muted)] hover:bg-[var(--salvia-elevated)] hover:text-[var(--salvia-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {unsupportedText ? (
            <div className="rounded-2xl border border-[var(--salvia-pink)]/40 bg-[var(--salvia-pink-soft)] p-4 text-[13px] text-[var(--salvia-text)]">
              {unsupportedText}
            </div>
          ) : null}

          {canRecord ? (
            <div className="rounded-2xl border border-[var(--salvia-border)] bg-[var(--salvia-elevated)] p-4">
              <p className="text-[13px] text-[var(--salvia-text-muted)]">{t('record_playback_hint')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {recording.isRecording ? (
                  <>
                    <button
                      type="button"
                      onClick={stopRecordingPlayback}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--salvia-pink)] px-4 text-[13px] font-semibold text-[#000000]"
                    >
                      <Square className="h-4 w-4 fill-current" />
                      {t('action_stop_recording')}
                    </button>
                    <span className="font-data text-[13px] font-medium text-[var(--salvia-cyan-text)]">
                      {t('recording_in_progress')} · {formatFileSize(recording.bytes)}
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startRecordingPlayback}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--salvia-iris)] bg-[var(--salvia-iris-soft)] px-4 text-[13px] font-semibold text-[var(--salvia-text)] hover:opacity-90"
                  >
                    <CircleDot className="h-4 w-4 text-[var(--salvia-pink)]" />
                    {t('action_record_playback')}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {!unsupportedText ? (
            <>
              <div>
                <label
                  htmlFor="salvia-quality-filename"
                  className="mb-1.5 block text-[12px] font-semibold text-[var(--salvia-text-muted)]"
                >
                  {t('file_name_label')}
                </label>
                <input
                  id="salvia-quality-filename"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--salvia-border)] bg-[var(--salvia-deep-cosmic)] px-3.5 text-[14px] text-[var(--salvia-text)] outline-none focus:border-[var(--salvia-iris)]"
                />
              </div>

              {videoFormats.length > 0 ? (
                <div className="space-y-2">
                  {audioFormats.length > 0 ? (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--salvia-cyan-text)]">
                      {t('quality_section_video')}
                    </p>
                  ) : null}
                  {videoFormats.map((format) => {
                    const selected = format.id === selectedFormat?.id;
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setSelectedId(format.id)}
                        className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors duration-150 ${
                          selected
                            ? 'border-[var(--salvia-iris)] bg-[var(--salvia-elevated)] ring-1 ring-[var(--salvia-cyan)]/40'
                            : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/70 hover:border-[var(--salvia-iris)]/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--salvia-text)]">{format.format}</p>
                          <p className="font-data mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                            {formatLineMeta(format)}
                          </p>
                        </div>
                        {selected ? <Check className="h-5 w-5 shrink-0 text-[var(--salvia-cyan)]" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {audioFormats.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--salvia-gold)]">
                    {t('quality_section_audio')}
                  </p>
                  {audioFormats.map((format) => {
                    const selected = format.id === selectedFormat?.id;
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setSelectedId(format.id)}
                        className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors duration-150 ${
                          selected
                            ? 'border-[var(--salvia-gold)] bg-[var(--salvia-elevated)] ring-1 ring-[var(--salvia-gold)]/40'
                            : 'border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/70 hover:border-[var(--salvia-gold)]/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--salvia-text)]">{format.format}</p>
                          <p className="font-data mt-0.5 text-[12px] text-[var(--salvia-text-muted)]">
                            {formatLineMeta(format)}
                          </p>
                        </div>
                        {selected ? <Check className="h-5 w-5 shrink-0 text-[var(--salvia-gold)]" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {!unsupportedText && selectedFormat ? (
          <div className="border-t border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)] p-4 sm:p-5">
            <button
              type="button"
              onClick={() => startDownloadFromFormat(selectedFormat, fileName)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8F6BFF] to-[#4CC4FF] px-5 text-[15px] font-bold text-white shadow-lg transition-opacity hover:opacity-95"
            >
              <Download className="h-5 w-5" />
              {t('confirm_download_cta')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
