import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';

// src/utils/atmosphere/ambientVisualMountMath.ts
// Pure mount gate for AmbientVisualOverlay (enabled + performance tier).

type AmbientMountGateInput = {
  /** User/store preference for ambient visual layer. */
  enabled: boolean;
  /** Resolved performance quality tier. */
  performanceTier: GeometricQualityTier;
  /** Geometric shell static mode (home/boot) — keep ambient off. */
  staticMode?: boolean;
};

/**
 * Whether AmbientVisualStage should mount a second WebGL canvas.
 * Lite tier always unmounts to avoid dual-WebGL pressure.
 */
export function shouldMountAmbientVisual({
  enabled,
  performanceTier,
  staticMode = false,
}: AmbientMountGateInput): boolean {
  if (staticMode) return false;
  if (!enabled) return false;
  if (performanceTier === 'lite') return false;
  return true;
}
