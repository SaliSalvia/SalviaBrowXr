import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPEED_DIAL_PINS,
  addSpeedDialPin,
  isUrlPinned,
  normalizeSpeedDialUrl,
  pinHostLabel,
  pinMonogram,
  removeSpeedDialPin,
} from './speedDial';
import { buildSiteShieldSummary, classifyConnectionSecurity } from './siteShield';
import {
  PARALLEL_CHUNK_MIN_BYTES,
  canUseParallelRange,
  computeByteRanges,
  parseTotalSizeFromContentRange,
} from './rangeChunkPlanner';
import {
  classifyEmbeddedPlayerUrl,
  inferResolutionFromUrl,
  isMediaContentType,
} from './mediaDetectorHeuristics';

test('speedDial normalizes URLs, prevents duplicates, and adds/removes pins cleanly', () => {
  assert.equal(normalizeSpeedDialUrl('wikipedia.org'), 'https://wikipedia.org/');
  assert.equal(normalizeSpeedDialUrl('not a valid url'), null);
  assert.equal(normalizeSpeedDialUrl('javascript:alert(1)'), null);

  assert.equal(isUrlPinned(DEFAULT_SPEED_DIAL_PINS, 'https://duckduckgo.com/'), true);
  assert.equal(pinHostLabel('https://www.reddit.com/r/videos'), 'reddit.com');
  assert.equal(pinMonogram('Vimeo', 'https://vimeo.com'), 'V');

  const added = addSpeedDialPin(DEFAULT_SPEED_DIAL_PINS, {
    title: 'MDN Docs',
    url: 'developer.mozilla.org',
  });
  assert.equal(added.ok, true);
  assert.equal(added.pins.length, DEFAULT_SPEED_DIAL_PINS.length + 1);

  const dup = addSpeedDialPin(added.pins, { url: 'https://developer.mozilla.org' });
  assert.equal(dup.ok, false);
  assert.equal(dup.error, 'DUPLICATE_PIN');

  const lastId = added.pins[added.pins.length - 1].id;
  const trimmed = removeSpeedDialPin(added.pins, lastId);
  assert.equal(trimmed.length, DEFAULT_SPEED_DIAL_PINS.length);
});

test('siteShield computes per-tab security, shield status, and quick extension flags', () => {
  assert.equal(classifyConnectionSecurity('https://example.com'), 'HTTPS');
  assert.equal(classifyConnectionSecurity('http://example.com'), 'HTTP');
  assert.equal(classifyConnectionSecurity('https://salvia.showcase/blender-open-movies'), 'SHOWCASE');
  assert.equal(classifyConnectionSecurity(''), 'EMPTY');

  const active = buildSiteShieldSummary({
    url: 'https://video.example.org/watch/1',
    isAdBlockEnabled: true,
    adBlockDisabledSites: [],
    tabBlockedCount: 7,
    totalBlockedCount: 42,
    enabledExtensionIds: ['force-dark-web'],
    isDesktopSite: false,
    isJavaScriptEnabled: true,
  });
  assert.equal(active.host, 'video.example.org');
  assert.equal(active.security, 'HTTPS');
  assert.equal(active.isShieldActiveForSite, true);
  assert.equal(active.tabBlockedCount, 7);
  assert.equal(active.isNightWebActive, true);
  assert.equal(active.isReaderModeActive, false);

  const exempt = buildSiteShieldSummary({
    url: 'https://video.example.org/watch/1',
    isAdBlockEnabled: true,
    adBlockDisabledSites: ['video.example.org'],
    tabBlockedCount: 0,
    totalBlockedCount: 42,
    enabledExtensionIds: [],
    isDesktopSite: true,
    isJavaScriptEnabled: true,
  });
  assert.equal(exempt.isSiteExempt, true);
  assert.equal(exempt.isShieldActiveForSite, false);
});

test('rangeChunkPlanner computes contiguous multi-connection byte ranges and parses Content-Range', () => {
  assert.equal(parseTotalSizeFromContentRange('bytes 0-0/1048576'), 1048576);
  assert.equal(parseTotalSizeFromContentRange('bytes 0-0/*'), null);

  assert.equal(canUseParallelRange(PARALLEL_CHUNK_MIN_BYTES - 1, true, 4), false);
  assert.equal(canUseParallelRange(PARALLEL_CHUNK_MIN_BYTES, false, 4), false);
  assert.equal(canUseParallelRange(PARALLEL_CHUNK_MIN_BYTES, true, 1), false);
  assert.equal(canUseParallelRange(1_000_000, true, 4), true);

  const ranges = computeByteRanges(1_000_000, 4);
  assert.equal(ranges.length, 4);
  assert.equal(ranges[0].start, 0);
  assert.equal(ranges[3].end, 999_999);
  for (let i = 1; i < ranges.length; i++) {
    assert.equal(ranges[i].start, ranges[i - 1].end + 1);
  }
});

test('mediaDetectorHeuristics classifies MIME types, resolutions, and embedded iframe providers', () => {
  assert.equal(isMediaContentType('video/mp4; codecs="avc1"'), true);
  assert.equal(isMediaContentType('application/vnd.apple.mpegurl'), true);
  assert.equal(isMediaContentType('text/html; charset=utf-8'), false);

  assert.deepEqual(inferResolutionFromUrl('https://cdn.example.com/v/clip_1080p.mp4'), {
    width: null,
    height: 1080,
  });
  assert.deepEqual(inferResolutionFromUrl('https://cdn.example.com/1280x720/video.mp4'), {
    width: 1280,
    height: 720,
  });

  assert.deepEqual(classifyEmbeddedPlayerUrl('https://player.vimeo.com/video/76979871?h=abc'), {
    provider: 'vimeo',
    canonicalUrl: 'https://vimeo.com/76979871',
  });
  assert.deepEqual(classifyEmbeddedPlayerUrl('https://www.dailymotion.com/embed/video/x8abcde'), {
    provider: 'dailymotion',
    canonicalUrl: 'https://www.dailymotion.com/video/x8abcde',
  });
  assert.deepEqual(classifyEmbeddedPlayerUrl('https://streamable.com/e/12abc'), {
    provider: 'streamable',
    canonicalUrl: 'https://streamable.com/12abc',
  });
});

test('downloadEngine executes multi-connection parallel HTTP Range chunks for >= 256 KB direct media', async () => {
  const { startTransfer } = await import('./downloadEngine');
  const totalBytes = PARALLEL_CHUNK_MIN_BYTES + 4096;
  const payload = new Uint8Array(totalBytes);
  for (let i = 0; i < totalBytes; i++) payload[i] = i & 0xff;

  const origFetch = globalThis.fetch;
  const seenRanges: string[] = [];
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const hdrs = (init?.headers || {}) as Record<string, string>;
    const range = hdrs.Range || '';
    seenRanges.push(range);
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = Number(match[2]);
      const slice = payload.slice(start, end + 1);
      return new Response(slice, {
        status: 206,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${totalBytes}`,
          'Accept-Ranges': 'bytes',
        },
      });
    }
    return new Response(payload, { status: 200, headers: { 'Content-Type': 'video/mp4' } });
  }) as typeof fetch;

  try {
    let completedSize = 0;
    await startTransfer(
      'dl-parallel-test',
      'https://cdn.example.com/big-video.mp4',
      false,
      'video/mp4',
      {
        onProgress: () => {},
        onComplete: (_blobUrl, finalSize) => {
          completedSize = finalSize;
        },
        onError: (msg) => {
          throw new Error(msg);
        },
        onPaused: () => {},
        onCancelled: () => {},
      },
      { parallelConnections: 4 }
    );
    assert.equal(completedSize, totalBytes);
    assert.equal(seenRanges.includes('bytes=0-0'), true);
    assert.equal(seenRanges.length, 5); // 1 probe + 4 parallel Range chunks
  } finally {
    globalThis.fetch = origFetch;
  }
});
