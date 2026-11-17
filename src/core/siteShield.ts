import { hostOfUrl } from './adBlockRules';

export type ConnectionSecurity = 'HTTPS' | 'HTTP' | 'SHOWCASE' | 'EMPTY';

export interface SiteShieldSummary {
  host: string;
  security: ConnectionSecurity;
  isAdBlockEnabled: boolean;
  isSiteExempt: boolean;
  isShieldActiveForSite: boolean;
  tabBlockedCount: number;
  totalBlockedCount: number;
  isNightWebActive: boolean;
  isReaderModeActive: boolean;
  isDesktopSite: boolean;
  isJavaScriptEnabled: boolean;
}

export function classifyConnectionSecurity(url: string | null | undefined): ConnectionSecurity {
  if (!url) return 'EMPTY';
  if (url.startsWith('https://salvia.showcase/')) return 'SHOWCASE';
  if (url.startsWith('https://')) return 'HTTPS';
  if (url.startsWith('http://')) return 'HTTP';
  return 'EMPTY';
}

export function buildSiteShieldSummary(params: {
  url: string | null | undefined;
  isAdBlockEnabled: boolean;
  adBlockDisabledSites: string[];
  tabBlockedCount: number;
  totalBlockedCount: number;
  enabledExtensionIds: string[];
  isDesktopSite: boolean;
  isJavaScriptEnabled: boolean;
}): SiteShieldSummary {
  const host = hostOfUrl(params.url) || '';
  const security = classifyConnectionSecurity(params.url);
  const isSiteExempt = Boolean(host && params.adBlockDisabledSites.includes(host));
  const isShieldActiveForSite = params.isAdBlockEnabled && !isSiteExempt && Boolean(host);

  return {
    host,
    security,
    isAdBlockEnabled: params.isAdBlockEnabled,
    isSiteExempt,
    isShieldActiveForSite,
    tabBlockedCount: Math.max(0, params.tabBlockedCount),
    totalBlockedCount: Math.max(0, params.totalBlockedCount),
    isNightWebActive: params.enabledExtensionIds.includes('force-dark-web'),
    isReaderModeActive: params.enabledExtensionIds.includes('reader-focus-mode'),
    isDesktopSite: params.isDesktopSite,
    isJavaScriptEnabled: params.isJavaScriptEnabled,
  };
}
