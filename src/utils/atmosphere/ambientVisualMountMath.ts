import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';
import { shouldMountAmbientForTier } from '../performance/interactive3dFrameCostMath';

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
 * Only high tier mounts — balanced/lite stay off to avoid dual-WebGL pressure.
 */
export function shouldMountAmbientVisual({
  enabled,
  performanceTier,
  staticMode = false,
}: AmbientMountGateInput): boolean {
  if (staticMode) return false;
  return shouldMountAmbientForTier(enabled, performanceTier);
}
