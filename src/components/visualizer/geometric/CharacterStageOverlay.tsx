import React, { Suspense, lazy } from 'react';
import type { MotionValue } from 'framer-motion';
import { CharacterStageErrorBoundary } from '../../character/CharacterStageErrorBoundary';
import { resolveCharacterStageDockStyle } from '../../character/characterStageDockMath';
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

type CharacterStageOverlayProps = {
  /** Hide when geometric stage is in static/paused shell mode or not playing. */
  visible: boolean;
  /**
   * Player chrome-hide / fullscreen play. Only adjusts bottom inset for the
   * vanished dock — fox stays companion-sized (no character-fullscreen mode).
   */
  immersive?: boolean;
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
  immersive = false,
  paused = false,
  currentTime = null,
}) => {
  const enabled = useCharacterStore((s) => s.enabled);
  if (!visible || !enabled) return null;

  return (
    <div
      data-testid="character-stage-dock"
      data-immersive={immersive ? 'true' : 'false'}
      className="absolute z-[3]"
      style={resolveCharacterStageDockStyle(immersive)}
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
