import React, { Suspense, lazy } from 'react';
import type { MotionValue } from 'framer-motion';
import { useAmbientVisualStore } from '../../../stores/useAmbientVisualStore';
import { usePerformanceMonitorStore } from '../../../stores/usePerformanceMonitorStore';
import { shouldMountAmbientVisual } from '../../../utils/atmosphere/ambientVisualMountMath';

// src/components/visualizer/geometric/AmbientVisualOverlay.tsx
// Ambient layer between Mineradio cover particles and Character (pointer-events none).

/** Keep cover particles readable while mood strategies stay visible. */
const AMBIENT_OVERLAY_OPACITY = 0.52;

const AmbientVisualStageLazy = lazy(() =>
  import('../strategies/AmbientVisualStage')
    .then((mod) => ({ default: mod.AmbientVisualStage }))
    .catch((error) => {
      console.warn('[AmbientVisualStage] lazy import failed:', error);
      return { default: () => null };
    }),
);

type AmbientVisualOverlayProps = {
  /** Hide on static geometric shell / when gate fails. */
  staticMode?: boolean;
  /** Audio/lyric clock shared with cover particles + character. */
  currentTime?: MotionValue<number> | null;
};

/**
 * Thin geometric-stage adapter for AmbientVisualStage.
 * Stacks above Mineradio (z-2) and below Character (z-3); does not replace cover particles.
 */
const AmbientVisualOverlay: React.FC<AmbientVisualOverlayProps> = ({
  staticMode = false,
  currentTime = null,
}) => {
  const enabled = useAmbientVisualStore((s) => s.enabled);
  const performanceTier = usePerformanceMonitorStore((s) => s.effectiveTier);
  const visible = shouldMountAmbientVisual({
    enabled,
    performanceTier,
    staticMode,
  });

  if (!visible) return null;

  return (
    <div
      data-testid="ambient-visual-overlay"
      className="absolute inset-0 z-[2]"
      style={{
        pointerEvents: 'none',
        opacity: AMBIENT_OVERLAY_OPACITY,
      }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <AmbientVisualStageLazy
          currentTime={currentTime}
          style={{ zIndex: 0 }}
        />
      </Suspense>
    </div>
  );
};

export default AmbientVisualOverlay;
