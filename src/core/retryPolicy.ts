/**
 * Pure retry, exponential backoff, jitter, and ISO-8601 duration utilities
 * shared by HLS/DASH/direct transfer engines and unit tests.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  signal?: AbortSignal;
  randomFn?: () => number;
  sleepFn?: (ms: number, signal?: AbortSignal) => Promise<void>;
  onRetry?: (attempt: number, delayMs: number, reason: string) => void;
}

export function isRetryableHttpStatus(status: number): boolean {
  if (status === 408 || status === 425 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

export function isRetryableError(err: unknown): boolean {
  if (!err) return true;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') {
    return false;
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'UnsupportedMediaError') return false;
    const msg = err.message.toUpperCase();
    if (
      msg.startsWith('HLS_DRM:') ||
      msg.startsWith('HLS_LIVE:') ||
      msg.startsWith('HLS_KEY_INVALID:') ||
      msg.startsWith('HLS_SEPARATE_AUDIO:') ||
      msg.startsWith('HLS_DECRYPT:') ||
      msg.startsWith('DASH_SEPARATE_AUDIO:') ||
      msg.startsWith('DASH_DRM:') ||
      msg.startsWith('DASH_LIVE:')
    ) {
      return false;
    }
    const statusMatch = msg.match(/\bHTTP\s+(\d{3})\b/);
    if (statusMatch) {
      return isRetryableHttpStatus(Number(statusMatch[1]));
    }
    return true;
  }
  return true;
}

export function computeRetryDelayMs(
  attempt: number,
  baseDelayMs = 450,
  maxDelayMs = 8000,
  jitterRatio = 0.25,
  randomFn: () => number = Math.random
): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, safeAttempt));
  const clampedJitter = Math.max(0, Math.min(0.5, jitterRatio));
  const offset = (randomFn() * 2 - 1) * clampedJitter * exp;
  return Math.max(50, Math.round(Math.min(maxDelayMs, exp + offset)));
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export async function runWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = Math.max(0, options.maxRetries ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 450;
  const maxDelayMs = options.maxDelayMs ?? 8000;
  const jitterRatio = options.jitterRatio ?? 0.25;
  const sleep = options.sleepFn ?? abortableSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      return await operation(attempt);
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries || options.signal?.aborted || !isRetryableError(err)) {
        throw err;
      }
      const delayMs = computeRetryDelayMs(
        attempt,
        baseDelayMs,
        maxDelayMs,
        jitterRatio,
        options.randomFn
      );
      const reason = err instanceof Error ? err.message : String(err);
      options.onRetry?.(attempt + 1, delayMs, reason);
      await sleep(delayMs, options.signal);
    }
  }
  throw lastError;
}

export class RetryableHttpError extends Error {
  readonly status: number;
  constructor(status: number, label = 'HTTP') {
    super(`${label} ${status}`);
    this.status = status;
    this.name = 'RetryableHttpError';
  }
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryOptions & { label?: string; fetchFn?: typeof fetch } = {}
): Promise<Response> {
  const doFetch = options.fetchFn ?? fetch;
  const label = options.label ?? 'HTTP';
  return runWithRetry(
    async () => {
      const res = await doFetch(url, { ...init, signal: options.signal ?? init.signal });
      if (!res.ok) {
        if (isRetryableHttpStatus(res.status)) {
          throw new RetryableHttpError(res.status, label);
        }
        throw new Error(`${label} ${res.status}`);
      }
      return res;
    },
    options
  );
}

/**
 * Parses ISO-8601 MPD durations such as "PT12S", "PT1H2M3.5S", "P0DT0H1M30S",
 * or plain numeric seconds strings.
 */
export function parseIsoDurationSeconds(raw: string | null | undefined): number {
  if (!raw) return 0;
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const direct = Number(trimmed);
  if (Number.isFinite(direct) && direct >= 0) return direct;

  const iso = trimmed.match(
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );
  if (!iso) return 0;
  const days = Number(iso[1] || 0);
  const hours = Number(iso[2] || 0);
  const minutes = Number(iso[3] || 0);
  const seconds = Number(iso[4] || 0);
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : 0;
}
