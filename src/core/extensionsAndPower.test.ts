import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRetryDelayMs,
  fetchWithRetry,
  isRetryableError,
  isRetryableHttpStatus,
  parseIsoDurationSeconds,
  runWithRetry,
} from './retryPolicy';
import {
  effectiveLiveTabLimit,
  effectiveParallelConnections,
  effectiveSegmentConcurrency,
  effectiveSimultaneousDownloads,
  resolveBatterySaverActive,
} from './batteryPolicy';
import { resolveActiveTheme } from './theme';
import {
  buildExtensionBridgeScript,
  buildExtensionRuntimePayload,
  hostMatchesPatterns,
  sanitizeUrlByExtensions,
  validateCustomExtensionInput,
} from './extensions';

test('retryPolicy classifies transient HTTP statuses and retries with exponential backoff', async () => {
  assert.equal(isRetryableHttpStatus(503), true);
  assert.equal(isRetryableHttpStatus(429), true);
  assert.equal(isRetryableHttpStatus(408), true);
  assert.equal(isRetryableHttpStatus(404), false);
  assert.equal(isRetryableHttpStatus(403), false);
  assert.equal(isRetryableError(new Error('HLS_DRM: SAMPLE-AES')), false);
  assert.equal(isRetryableError(new Error('Segment HTTP 502')), true);

  const d0 = computeRetryDelayMs(0, 400, 8000, 0, () => 0.5);
  const d1 = computeRetryDelayMs(1, 400, 8000, 0, () => 0.5);
  const d2 = computeRetryDelayMs(2, 400, 8000, 0, () => 0.5);
  assert.equal(d0, 400);
  assert.equal(d1, 800);
  assert.equal(d2, 1600);

  let attempts = 0;
  const retries: number[] = [];
  const result = await runWithRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('HTTP 503');
      return 'ok';
    },
    {
      maxRetries: 3,
      sleepFn: async () => {},
      onRetry: (attempt) => retries.push(attempt),
    }
  );
  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
  assert.deepEqual(retries, [1, 2]);
});

test('fetchWithRetry succeeds after transient 502 responses and parseIsoDurationSeconds parses DASH MPD times', async () => {
  let calls = 0;
  const mockFetch = (async () => {
    calls += 1;
    if (calls === 1) {
      return new Response('bad gateway', { status: 502 });
    }
    return new Response('segment-bytes', { status: 200 });
  }) as unknown as typeof fetch;

  const res = await fetchWithRetry(
    'https://cdn.example.com/seg1.m4s',
    {},
    { maxRetries: 2, sleepFn: async () => {}, fetchFn: mockFetch }
  );
  assert.equal(res.status, 200);
  assert.equal(calls, 2);

  assert.equal(parseIsoDurationSeconds('PT12S'), 12);
  assert.equal(parseIsoDurationSeconds('PT1H2M3.5S'), 3723.5);
  assert.equal(parseIsoDurationSeconds('P0DT0H1M30S'), 90);
  assert.equal(parseIsoDurationSeconds('45'), 45);
  assert.equal(parseIsoDurationSeconds(''), 0);
});

test('batteryPolicy resolves auto/manual modes and scales live tabs and concurrency', () => {
  assert.equal(resolveBatterySaverActive('on', 0.9, true), true);
  assert.equal(resolveBatterySaverActive('off', 0.1, false), false);
  assert.equal(resolveBatterySaverActive('auto', 0.2, false), true);
  assert.equal(resolveBatterySaverActive('auto', 0.2, true), false);
  assert.equal(resolveBatterySaverActive('auto', 0.65, false), false);

  assert.equal(effectiveLiveTabLimit(false), 8);
  assert.equal(effectiveLiveTabLimit(true), 3);
  assert.equal(effectiveParallelConnections(4, true), 2);
  assert.equal(effectiveParallelConnections(4, false), 4);
  assert.equal(effectiveSimultaneousDownloads(3, true), 2);
  assert.equal(effectiveSegmentConcurrency(true), 2);
  assert.equal(effectiveSegmentConcurrency(false), 4);
});

test('theme resolver maps system, dark, and light modes deterministically', () => {
  assert.equal(resolveActiveTheme('dark', false), 'dark');
  assert.equal(resolveActiveTheme('light', true), 'light');
  assert.equal(resolveActiveTheme('system', true), 'dark');
  assert.equal(resolveActiveTheme('system', false), 'light');
});

test('extensions engine strips tracking parameters, filters by host, and builds runtime injection', () => {
  const cleaned = sanitizeUrlByExtensions(
    'https://example.com/watch?v=123&utm_source=x&fbclid=abc&gclid=xyz',
    ['tracking-param-cleaner']
  );
  assert.equal(cleaned, 'https://example.com/watch?v=123');

  const untouched = sanitizeUrlByExtensions(
    'https://example.com/watch?v=123&utm_source=x',
    ['cookie-annoyance-shield']
  );
  assert.equal(untouched, 'https://example.com/watch?v=123&utm_source=x');

  assert.equal(hostMatchesPatterns('video.example.com', ['*.example.com']), true);
  assert.equal(hostMatchesPatterns('other.org', ['example.com']), false);

  const customExt = {
    id: 'custom-1',
    name: 'Compact Header',
    description: 'Tightens header padding',
    category: 'custom' as const,
    version: '1.0.0',
    isBuiltIn: false,
    permissions: ['CSS injection'],
    css: 'header { padding: 4px !important; }',
    matchHosts: ['example.com'],
  };

  const payload = buildExtensionRuntimePayload(
    ['cookie-annoyance-shield', 'custom-1'],
    [customExt],
    'blog.example.com'
  );
  assert.deepEqual(payload.activeIds, ['cookie-annoyance-shield', 'custom-1']);
  assert.ok(payload.css.includes('salvia') || payload.css.includes('onetrust'));
  assert.ok(payload.css.includes('header { padding: 4px !important; }'));

  const script = buildExtensionBridgeScript(payload);
  assert.ok(script.includes('salvia-ext-runtime-style'));

  assert.equal(validateCustomExtensionInput({ name: 'A', css: 'body{}' }).valid, false);
  assert.equal(validateCustomExtensionInput({ name: 'My Script', css: '' }).valid, false);
  assert.equal(validateCustomExtensionInput({ name: 'Night Tweak', css: 'body{color:#fff}' }).valid, true);
});
