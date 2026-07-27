import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';
import type { PerformanceMemorySample, PerformanceMode } from '../../types/performance';

// src/utils/performance/performanceMonitorMath.ts
// Pure FPS / memory / tier ladder helpers for Ticket 10.

export const PERFORMANCE_FPS_LOW = 25;
export const PERFORMANCE_FPS_HIGH = 50;
export const PERFORMANCE_DEGRADE_HOLD_SEC = 2.5;
export const PERFORMANCE_UPGRADE_HOLD_SEC = 8;
export const PERFORMANCE_STORE_PUBLISH_MS = 500;
export const PERFORMANCE_MEMORY_WARN_RATIO = 0.85;

const TIER_ORDER: GeometricQualityTier[] = ['lite', 'balanced', 'high'];

export type FpsTrackerState = {
  samples: number[];
  capacity: number;
  instant: number;
  avg: number;
  min: number;
};

/** Rolling FPS window (one sample ≈ one frame). */
export function createFpsTracker(capacity = 90): FpsTrackerState {
  return {
    samples: [],
    capacity: Math.max(15, capacity),
    instant: 0,
    avg: 60,
    min: 60,
  };
}

/**
 * Ingest a frame delta (seconds) and refresh rolling stats.
 */
export function pushFpsSample(tracker: FpsTrackerState, dtSec: number): FpsTrackerState {
  const safeDt = Math.min(0.25, Math.max(0.001, dtSec));
  const fps = 1 / safeDt;
  tracker.samples.push(fps);
  if (tracker.samples.length > tracker.capacity) {
    tracker.samples.shift();
  }
  tracker.instant = fps;
  const sum = tracker.samples.reduce((acc, value) => acc + value, 0);
  tracker.avg = sum / tracker.samples.length;
  tracker.min = Math.min(...tracker.samples);
  return tracker;
}

export function tierRank(tier: GeometricQualityTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function stepTierDown(tier: GeometricQualityTier): GeometricQualityTier {
  const rank = tierRank(tier);
  return TIER_ORDER[Math.max(0, rank - 1)];
}

export function stepTierUp(
  tier: GeometricQualityTier,
  ceiling: GeometricQualityTier,
): GeometricQualityTier {
  const rank = tierRank(tier);
  const maxRank = tierRank(ceiling);
  return TIER_ORDER[Math.min(maxRank, rank + 1)];
}

/**
 * Resolve the quality tier from mode + optional auto ladder offset from baseline.
 */
export function resolveEffectivePerformanceTier(
  mode: PerformanceMode,
  baseline: GeometricQualityTier,
  autoTier: GeometricQualityTier,
): GeometricQualityTier {
  if (mode === 'auto') return autoTier;
  return mode;
}

export function shouldHoldDegrade(avgFps: number, holdSec: number, neededSec: number): boolean {
  return avgFps < PERFORMANCE_FPS_LOW && holdSec >= neededSec;
}

export function shouldHoldUpgrade(avgFps: number, holdSec: number, neededSec: number): boolean {
  return avgFps > PERFORMANCE_FPS_HIGH && holdSec >= neededSec;
}

/** Read Chrome/Electron performance.memory when available. */
export function readPerformanceMemorySample(
  perf: Performance = performance,
): PerformanceMemorySample | null {
  const memory = (perf as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  if (!memory || !(memory.usedJSHeapSize > 0)) return null;
  return {
    usedMb: memory.usedJSHeapSize / (1024 * 1024),
    limitMb: memory.jsHeapSizeLimit > 0 ? memory.jsHeapSizeLimit / (1024 * 1024) : null,
  };
}

export function isMemoryPressureHigh(sample: PerformanceMemorySample | null): boolean {
  if (!sample || sample.limitMb == null || !(sample.limitMb > 0)) return false;
  return sample.usedMb / sample.limitMb >= PERFORMANCE_MEMORY_WARN_RATIO;
}

export function parsePerformanceMode(value: string | null | undefined): PerformanceMode {
  if (value === 'high' || value === 'balanced' || value === 'lite' || value === 'auto') {
    return value;
  }
  return 'auto';
}
