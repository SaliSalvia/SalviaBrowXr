import type { ThemeMode } from '../types/models';

export type ResolvedTheme = 'dark' | 'light';

export function resolveActiveTheme(mode: ThemeMode, systemPrefersDark: boolean): ResolvedTheme {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}

export function applyAppearanceToDocument(
  resolvedTheme: ResolvedTheme,
  batterySaverActive: boolean
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  root.style.colorScheme = resolvedTheme;

  if (batterySaverActive) {
    root.classList.add('salvia-battery-saver');
  } else {
    root.classList.remove('salvia-battery-saver');
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', resolvedTheme === 'dark' ? '#000000' : '#F4F3FB');
  }
}
