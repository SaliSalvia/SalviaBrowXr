import { MAX_LIVE_TABS } from './constants';
import type { BatterySaverMode } from '../types/models';

export const BATTERY_AUTO_THRESHOLD = 0.25;
export const BATTERY_MAX_LIVE_TABS = 3;

export function resolveBatterySaverActive(
  mode: BatterySaverMode,
  batteryLevel: number | null | undefined,
  isCharging: boolean | null | undefined
): boolean {
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  if (isCharging === true) return false;
  if (typeof batteryLevel === 'number' && Number.isFinite(batteryLevel)) {
    return batteryLevel <= BATTERY_AUTO_THRESHOLD;
  }
  return false;
}

export function effectiveLiveTabLimit(batterySaverActive: boolean): number {
  return batterySaverActive ? BATTERY_MAX_LIVE_TABS : MAX_LIVE_TABS;
}

export function effectiveParallelConnections(requested: number, batterySaverActive: boolean): number {
  const safe = Math.max(1, Math.min(8, Math.floor(requested || 4)));
  return batterySaverActive ? Math.min(2, safe) : safe;
}

export function effectiveSimultaneousDownloads(requested: number, batterySaverActive: boolean): number {
  const safe = Math.max(1, Math.min(6, Math.floor(requested || 3)));
  return batterySaverActive ? Math.min(2, safe) : safe;
}

export function effectiveSegmentConcurrency(batterySaverActive: boolean): number {
  return batterySaverActive ? 2 : 4;
}
