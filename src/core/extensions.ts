import type { BrowserExtension } from '../types/models';

export const BUILTIN_EXTENSIONS: BrowserExtension[] = [
  {
    id: 'cookie-annoyance-shield',
    name: 'Cookie & Scroll-Lock Shield',
    nameFa: 'سپر بنر کوکی و قفل اسکرول',
    description:
      'Hides intrusive cookie banners, newsletter popups, and restores page scrolling automatically.',
    descriptionFa:
      'بنرهای مزاحم کوکی و پاپ‌آپ‌های خبرنامه را مخفی کرده و اسکرول مسدودشده صفحات را آزاد می‌کند.',
    category: 'privacy',
    version: '1.2.0',
    isBuiltIn: true,
    enabledByDefault: true,
    permissions: ['CSS injection', 'DOM cleanup'],
    css: `
      [id*="onetrust"], [class*="onetrust"],
      [id*="cookie-banner"], [class*="cookie-banner"],
      [id*="cookieConsent"], [class*="cookie-consent"],
      [id*="gdpr"], [class*="gdpr-banner"],
      .cc-window, .fc-consent-root, #CybotCookiebotDialog {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html, body {
        overflow-y: auto !important;
      }
    `,
    js: `
      try {
        var de = document.documentElement;
        var b = document.body;
        if (de && de.style.overflow === 'hidden') de.style.overflow = 'auto';
        if (b && b.style.overflow === 'hidden') b.style.overflow = 'auto';
      } catch (_) {}
    `,
  },
  {
    id: 'tracking-param-cleaner',
    name: 'Tracking Link Cleaner',
    nameFa: 'پاک‌سازی لینک‌های ردیابی',
    description:
      'Strips UTM, fbclid, gclid, igshid, and analytics parameters from links and navigation URLs.',
    descriptionFa:
      'پارامترهای ردیابی مانند utm و fbclid و gclid را پیش از بارگذاری از آدرس صفحات حذف می‌کند.',
    category: 'privacy',
    version: '1.1.0',
    isBuiltIn: true,
    enabledByDefault: true,
    permissions: ['URL query filter'],
  },
  {
    id: 'video-speed-booster',
    name: 'Video Speed & Boost Pill',
    nameFa: 'کنترل سرعت هوشمند ویدیو',
    description:
      'Adds a subtle floating 1x / 1.5x / 2x speed pill and keyboard shortcuts ([ / ]) on HTML5 video players.',
    descriptionFa:
      'کنترل سریع تغییر سرعت پخش (۱x تا ۲x) را به پخش‌کننده‌های ویدیوی صفحات وب اضافه می‌کند.',
    category: 'media',
    version: '1.3.0',
    isBuiltIn: true,
    enabledByDefault: true,
    permissions: ['HTMLVideoElement control'],
    css: `
      .salvia-ext-speed-pill {
        position: fixed;
        right: 12px;
        bottom: 66px;
        z-index: 2147483640;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(16, 12, 32, 0.84);
        border: 1px solid rgba(143, 107, 255, 0.45);
        color: #F4F2FF;
        font: 600 11px/1 system-ui, sans-serif;
        backdrop-filter: blur(8px);
        cursor: pointer;
        user-select: none;
      }
    `,
    js: `
      try {
        if (!window.__salviaSpeedInit) {
          window.__salviaSpeedInit = true;
          var speeds = [1, 1.25, 1.5, 2];
          var idx = 0;
          var ensurePill = function () {
            var videos = document.querySelectorAll('video');
            var hasPlayable = false;
            for (var i = 0; i < videos.length; i++) {
              if ((videos[i].duration || 0) > 2 || videos[i].readyState > 0) {
                hasPlayable = true;
                break;
              }
            }
            var existing = document.getElementById('salvia-ext-speed-btn');
            if (!hasPlayable) {
              if (existing) existing.remove();
              return;
            }
            if (!existing && document.body) {
              var btn = document.createElement('button');
              btn.id = 'salvia-ext-speed-btn';
              btn.type = 'button';
              btn.className = 'salvia-ext-speed-pill';
              btn.textContent = speeds[idx] + 'x';
              btn.addEventListener('click', function () {
                idx = (idx + 1) % speeds.length;
                var rate = speeds[idx];
                btn.textContent = rate + 'x';
                document.querySelectorAll('video').forEach(function (v) {
                  try { v.playbackRate = rate; } catch (_) {}
                });
              });
              document.body.appendChild(btn);
            }
          };
          setInterval(ensurePill, 2200);
          ensurePill();
        }
      } catch (_) {}
    `,
  },
  {
    id: 'force-dark-web',
    name: 'Midnight Web Darkener',
    nameFa: 'حالت شب خودکار وب‌سایت‌ها',
    description:
      'Applies adaptive dark contrast to bright web pages while keeping photos and videos natural.',
    descriptionFa:
      'صفحات وب روشن را با حفظ رنگ طبیعی تصاویر و ویدیوها به حالت تیره سازگار تبدیل می‌کند.',
    category: 'appearance',
    version: '1.1.0',
    isBuiltIn: true,
    enabledByDefault: false,
    permissions: ['Adaptive CSS filter'],
    css: `
      html {
        filter: invert(0.92) hue-rotate(180deg) !important;
        background: #0c0a16 !important;
      }
      img, video, picture, svg, canvas, iframe, [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `,
  },
  {
    id: 'reader-focus-mode',
    name: 'Reader Focus Mode',
    nameFa: 'حالت مطالعه متمرکز',
    description:
      'Softens sidebars, sticky headers, and widens readable article line height for distraction-free reading.',
    descriptionFa:
      'نوارهای کناری و هدرهای مزاحم را کم‌رنگ کرده و خوانایی متون و مقالات را بهبود می‌بخشد.',
    category: 'reading',
    version: '1.0.0',
    isBuiltIn: true,
    enabledByDefault: false,
    permissions: ['Typography & layout CSS'],
    css: `
      aside, [role="complementary"], [class*="sidebar"], [id*="sidebar"], [class*="promo"] {
        opacity: 0.25 !important;
        transition: opacity 180ms ease !important;
      }
      aside:hover, [role="complementary"]:hover {
        opacity: 1 !important;
      }
      article, main, [role="main"] {
        max-width: 78ch !important;
        margin-inline: auto !important;
        line-height: 1.78 !important;
      }
    `,
  },
];

const TRACKING_QUERY_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'yclid',
  '_hsenc',
  '_hsmi',
  'vero_conv',
  'vero_id',
  'ref_src',
  'ref_url',
  'si',
]);

export function sanitizeUrlByExtensions(rawUrl: string, enabledExtensionIds: string[]): string {
  if (!enabledExtensionIds.includes('tracking-param-cleaner')) {
    return rawUrl;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return rawUrl;
    }
    let changed = false;
    for (const key of Array.from(parsed.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || TRACKING_QUERY_PARAMS.has(lower)) {
        parsed.searchParams.delete(key);
        changed = true;
      }
    }
    return changed ? parsed.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

export function getAllExtensions(customExtensions: BrowserExtension[]): BrowserExtension[] {
  return [...BUILTIN_EXTENSIONS, ...customExtensions];
}

export function hostMatchesPatterns(hostname: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return true;
  const h = hostname.toLowerCase();
  return patterns.some((p) => {
    const clean = p.trim().toLowerCase().replace(/^\*\./, '');
    if (!clean || clean === '*') return true;
    return h === clean || h.endsWith(`.${clean}`);
  });
}

export interface ExtensionRuntimePayload {
  css: string;
  js: string;
  activeIds: string[];
}

export function buildExtensionRuntimePayload(
  enabledExtensionIds: string[],
  customExtensions: BrowserExtension[],
  pageHostname?: string | null
): ExtensionRuntimePayload {
  const enabledSet = new Set(enabledExtensionIds);
  const all = getAllExtensions(customExtensions);
  const cssParts: string[] = [];
  const jsParts: string[] = [];
  const activeIds: string[] = [];

  for (const ext of all) {
    if (!enabledSet.has(ext.id)) continue;
    if (pageHostname && !hostMatchesPatterns(pageHostname, ext.matchHosts)) continue;
    activeIds.push(ext.id);
    if (ext.css && ext.css.trim()) {
      cssParts.push(`/* ext:${ext.id} */\n${ext.css}`);
    }
    if (ext.js && ext.js.trim()) {
      jsParts.push(`try {\n${ext.js}\n} catch (_extErr) {}`);
    }
  }

  return {
    css: cssParts.join('\n'),
    js: jsParts.join('\n'),
    activeIds,
  };
}

export function buildExtensionBridgeScript(payload: ExtensionRuntimePayload): string {
  const serializedCss = JSON.stringify(payload.css);
  const serializedJs = JSON.stringify(payload.js);
  return `(function(){try{
    var id='salvia-ext-runtime-style';
    var style=document.getElementById(id);
    var css=${serializedCss};
    if(css){
      if(!style){style=document.createElement('style');style.id=id;(document.head||document.documentElement).appendChild(style);}
      style.textContent=css;
    }else if(style){style.remove();}
    var code=${serializedJs};
    if(code){
      try{(new Function(code))();}catch(_e){}
    }
  }catch(_){}})();`;
}

export function validateCustomExtensionInput(input: {
  name: string;
  description?: string;
  css?: string;
  js?: string;
  matchHosts?: string[];
}): { valid: boolean; error?: string } {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 48) {
    return { valid: false, error: 'Extension name must be 2–48 characters.' };
  }
  if (!input.css?.trim() && !input.js?.trim()) {
    return { valid: false, error: 'Provide CSS styles or JavaScript code.' };
  }
  return { valid: true };
}
