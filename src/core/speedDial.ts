import type { SpeedDialPin } from '../types/models';

const SHOWCASE_URL = 'https://salvia.showcase/blender-open-movies';

export const DEFAULT_SPEED_DIAL_PINS: SpeedDialPin[] = [
  {
    id: 'pin-showcase',
    title: 'Media Showcase',
    url: SHOWCASE_URL,
    accent: '#4CC4FF',
    isBuiltIn: true,
  },
  {
    id: 'pin-duckduckgo',
    title: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    accent: '#8F6BFF',
    isBuiltIn: true,
  },
  {
    id: 'pin-wikipedia',
    title: 'Wikipedia',
    url: 'https://en.wikipedia.org',
    accent: '#D9AE54',
    isBuiltIn: true,
  },
  {
    id: 'pin-archive',
    title: 'Internet Archive',
    url: 'https://archive.org/details/movies',
    accent: '#4CC4FF',
    isBuiltIn: true,
  },
  {
    id: 'pin-vimeo',
    title: 'Vimeo',
    url: 'https://vimeo.com/watch',
    accent: '#8F6BFF',
    isBuiltIn: true,
  },
  {
    id: 'pin-reddit',
    title: 'Reddit',
    url: 'https://www.reddit.com',
    accent: '#FF6B9D',
    isBuiltIn: true,
  },
];

const ACCENT_PALETTE = ['#8F6BFF', '#4CC4FF', '#D9AE54', '#FF6B9D'];

export function normalizeSpeedDialUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function pinHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function pinMonogram(title: string, url: string): string {
  const cleanTitle = title.trim();
  if (cleanTitle) return cleanTitle.charAt(0).toUpperCase();
  const host = pinHostLabel(url);
  return (host.charAt(0) || 'S').toUpperCase();
}

export function isUrlPinned(pins: SpeedDialPin[], url: string | null | undefined): boolean {
  if (!url) return false;
  const normalized = url.replace(/\/+$/, '').toLowerCase();
  return pins.some((p) => p.url.replace(/\/+$/, '').toLowerCase() === normalized);
}

export function addSpeedDialPin(
  pins: SpeedDialPin[],
  input: { title?: string; url: string }
): { ok: boolean; pins: SpeedDialPin[]; error?: string } {
  const normalizedUrl = normalizeSpeedDialUrl(input.url);
  if (!normalizedUrl) {
    return { ok: false, pins, error: 'INVALID_URL' };
  }
  if (isUrlPinned(pins, normalizedUrl)) {
    return { ok: false, pins, error: 'DUPLICATE_PIN' };
  }
  const host = pinHostLabel(normalizedUrl);
  const title = input.title?.trim() || host;
  const accent = ACCENT_PALETTE[pins.length % ACCENT_PALETTE.length];
  const nextPin: SpeedDialPin = {
    id: `pin-${Date.now().toString(36)}-${pins.length}`,
    title: title.slice(0, 36),
    url: normalizedUrl,
    accent,
    isBuiltIn: false,
  };
  return { ok: true, pins: [...pins, nextPin].slice(0, 16) };
}

export function removeSpeedDialPin(pins: SpeedDialPin[], pinId: string): SpeedDialPin[] {
  return pins.filter((p) => p.id !== pinId);
}
