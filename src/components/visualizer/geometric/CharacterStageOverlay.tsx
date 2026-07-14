import React, { Suspense, lazy } from 'react';
import type { MotionValue } from 'framer-motion';
import { CharacterStageErrorBoundary } from '../../character/CharacterStageErrorBoundary';
import { useCharacterStore } from '../../../stores/useCharacterStore';

// src/components/visualizer/geometric/CharacterStageOverlay.tsx
// Mounts Interactive Character Layer as a bottom-right corner dock.
// CharacterStage is lazy-loaded so GLTFLoader stays off the boot critical path.

const CharacterStageLazy = lazy(() =>
  import('../../character/CharacterStage')
    .then((mod) => ({ default: mod.CharacterStage }))
    .catch((error) => {
      console.warn('[CharacterStage] lazy import failed:', error);
      // Keep Suspense/ErrorBoundary happy with a no-op component instead of rejecting.
      return { default: () => null };
    }),
);

/** Corner dock size — keeps the companion clear of center lyrics. */
const CHARACTER_DOCK_WIDTH = 'min(42vw, 280px)';
const CHARACTER_DOCK_HEIGHT = 'min(42vw, 280px)';

type CharacterStageOverlayProps = {
  /** Hide when geometric stage is in static/paused shell mode or not playing. */
  visible: boolean;
  /** Pause skeletal animation without tearing down the WebGL layer. */
  paused?: boolean;
  /** Audio/lyric clock for beat-map rhythm drive. */
  currentTime?: MotionValue<number> | null;
};

/**
 * Thin geometric-stage adapter for CharacterStage.
 * Anchors the character to the bottom-right above the floating player bar.
 */
const CharacterStageOverlay: React.FC<CharacterStageOverlayProps> = ({
  visible,
  paused = false,
  currentTime = null,
}) => {
  const enabled = useCharacterStore((s) => s.enabled);
  if (!visible || !enabled) return null;

  return (
    <div
      data-testid="character-stage-dock"
      className="absolute z-[3]"
      style={{
        right: 'max(12px, env(safe-area-inset-right, 0px))',
        bottom: 'calc(var(--app-player-bar-height, 72px) + 16px + env(safe-area-inset-bottom, 0px))',
        width: CHARACTER_DOCK_WIDTH,
        height: CHARACTER_DOCK_HEIGHT,
        pointerEvents: 'auto',
      }}
      aria-hidden
    >
      <CharacterStageErrorBoundary>
        <Suspense fallback={null}>
          <CharacterStageLazy
            paused={paused}
            currentTime={currentTime}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />
        </Suspense>
      </CharacterStageErrorBoundary>
    </div>
  );
};

export default CharacterStageOverlay;
