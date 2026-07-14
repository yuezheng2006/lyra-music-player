// src/types/performance.ts
// Performance mode + live monitor contracts (Ticket 10).

import type { GeometricQualityTier } from '../components/visualizer/geometric/geometricQuality';

/** User preference for visual quality / auto-adapt. */
export type PerformanceMode = 'auto' | GeometricQualityTier;

export type PerformanceMemorySample = {
  usedMb: number;
  limitMb: number | null;
};

export type PerformanceMonitorSnapshot = {
  fpsInstant: number;
  fpsAvg: number;
  fpsMin: number;
  memory: PerformanceMemorySample | null;
  effectiveTier: GeometricQualityTier;
  autoDegraded: boolean;
};
