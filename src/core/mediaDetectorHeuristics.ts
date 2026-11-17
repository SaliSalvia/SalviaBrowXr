export function isMediaContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const low = contentType.split(';')[0].trim().toLowerCase();
  return (
    low.startsWith('video/') ||
    low.startsWith('audio/') ||
    low.includes('mpegurl') ||
    low.includes('dash+xml') ||
    low === 'application/x-mpegurl' ||
    low === 'application/vnd.apple.mpegurl'
  );
}

export function inferResolutionFromUrl(url: string): { width: number | null; height: number | null } {
  const whMatch = url.match(/\/(\d{3,4})x(\d{3,4})(?:\/|_|\.|\?|$)/i);
  if (whMatch) {
    const width = Number(whMatch[1]);
    const height = Number(whMatch[2]);
    if (Number.isFinite(width) && Number.isFinite(height) && height >= 144 && height <= 4320) {
      return { width, height };
    }
  }
  const pMatch = url.match(/[\/_-](\d{3,4})p(?:[\/_.?&-]|$)/i);
  if (pMatch) {
    const height = Number(pMatch[1]);
    if (Number.isFinite(height) && height >= 144 && height <= 4320) {
      return { width: null, height };
    }
  }
  return { width: null, height: null };
}

export type EmbeddedPlayerProvider = 'vimeo' | 'dailymotion' | 'streamable' | 'jwplayer' | null;

export function classifyEmbeddedPlayerUrl(iframeUrl: string): {
  provider: EmbeddedPlayerProvider;
  canonicalUrl: string | null;
} {
  try {
    const u = new URL(iframeUrl);
    const host = u.hostname.toLowerCase();
    if (host.includes('player.vimeo.com')) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return { provider: 'vimeo', canonicalUrl: `https://vimeo.com/${m[1]}` };
    }
    if (host.includes('dailymotion.com') && u.pathname.includes('/embed/video/')) {
      const m = u.pathname.match(/\/embed\/video\/([A-Za-z0-9]+)/);
      if (m) return { provider: 'dailymotion', canonicalUrl: `https://www.dailymotion.com/video/${m[1]}` };
    }
    if (host.includes('streamable.com') && u.pathname.includes('/e/')) {
      const m = u.pathname.match(/\/e\/([A-Za-z0-9]+)/);
      if (m) return { provider: 'streamable', canonicalUrl: `https://streamable.com/${m[1]}` };
    }
    if (host.includes('jwplatform.com') || host.includes('cdn.jwplayer.com')) {
      return { provider: 'jwplayer', canonicalUrl: iframeUrl };
    }
    return { provider: null, canonicalUrl: null };
  } catch {
    return { provider: null, canonicalUrl: null };
  }
}
