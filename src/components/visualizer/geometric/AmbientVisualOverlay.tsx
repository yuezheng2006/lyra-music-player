import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { useAmbientVisualStore } from '../../../stores/useAmbientVisualStore';
import { useMoodEngineStore } from '../../../stores/useMoodEngineStore';
import { usePerformanceMonitorStore } from '../../../stores/usePerformanceMonitorStore';
import { shouldMountAmbientVisual } from '../../../utils/atmosphere/ambientVisualMountMath';

// src/components/visualizer/geometric/AmbientVisualOverlay.tsx
// Ambient layer between Mineradio cover particles and Character (pointer-events none).

/** Keep cover particles readable while mood strategies stay visible. */
const AMBIENT_OVERLAY_OPACITY = 0.58;
/** Brief boost after user emotion correction so the strategy switch is legible. */
const AMBIENT_CORRECTION_BOOST_OPACITY = 0.88;
const AMBIENT_CORRECTION_BOOST_MS = 1600;

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
  const correctionPulseAt = useMoodEngineStore((s) => s.correctionPulseAt);
  const performanceTier = usePerformanceMonitorStore((s) => s.effectiveTier);
  const [boosted, setBoosted] = useState(false);
  const visible = shouldMountAmbientVisual({
    enabled,
    performanceTier,
    staticMode,
  });

  useEffect(() => {
    if (!correctionPulseAt) return undefined;
    setBoosted(true);
    const timer = window.setTimeout(() => setBoosted(false), AMBIENT_CORRECTION_BOOST_MS);
    return () => window.clearTimeout(timer);
  }, [correctionPulseAt]);

  if (!visible) return null;

  return (
    <div
      data-testid="ambient-visual-overlay"
      className="absolute inset-0 z-[2]"
      style={{
        pointerEvents: 'none',
        opacity: boosted ? AMBIENT_CORRECTION_BOOST_OPACITY : AMBIENT_OVERLAY_OPACITY,
        transition: 'opacity 280ms ease-out',
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
