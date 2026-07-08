import React, { useMemo, useRef } from 'react';
import { useMotionValue } from 'framer-motion';
import { resolveInteractive3dQualityProfile } from './interactive3dSceneRegistry';
import { resolveGeometricQualityProfile } from './geometricQuality';
import MineradioPlaybackStage from './mineradio/MineradioPlaybackStage';
import StaticGeometricScene from './StaticGeometricScene';
import type { GeometricBackgroundProps } from './types';
import { useGeometricPointer } from './useGeometricPointer';
import { useInteractiveCameraControl } from './useInteractiveCameraControl';
import VignetteOverlay from './VignetteOverlay';

// src/components/visualizer/geometric/GeometricLayer.tsx
// Mineradio unified WebGL playback background (cover particles + stage lyrics).

const GeometricLayer: React.FC<GeometricBackgroundProps> = ({
    theme,
    audioBands,
    beatPulse,
    atmosphereEnergy,
    enableBeatBursts = true,
    interactive3dSceneTuning,
    seed,
    disableVignette = false,
    paused = false,
    staticMode = false,
    coverUrl,
    currentTime,
    lines = [],
    showLyrics = true,
    playing = true,
}) => {
    const { pointerX, pointerY } = useGeometricPointer();
    const fallbackMotion = useMotionValue(0);
    const interactionRef = useRef<HTMLDivElement>(null);
    const sceneTuning = interactive3dSceneTuning;
    const cameraControl = sceneTuning?.cameraControl ?? 'auto';
    const cameraControlState = useInteractiveCameraControl({
        mode: cameraControl,
        paused,
        staticMode,
        captureRef: interactionRef,
    });
    const qualityProfile = useMemo(
        () => sceneTuning
            ? resolveInteractive3dQualityProfile(sceneTuning)
            : resolveGeometricQualityProfile(),
        [sceneTuning],
    );

    return (
        <div className="absolute inset-0">
            {cameraControlState.isInteractive && (
                <div
                    ref={interactionRef}
                    className="absolute inset-0 z-[1] touch-none"
                    style={{ pointerEvents: 'auto' }}
                    data-testid="interactive3d-camera-capture"
                    aria-hidden
                />
            )}
            {paused ? (
                <StaticGeometricScene
                    theme={theme}
                    shapes={[]}
                    particles={[]}
                    hideShapes
                    disableVignette={disableVignette}
                />
            ) : (
                <MineradioPlaybackStage
                    theme={theme}
                    coverUrl={coverUrl}
                    sceneTuning={sceneTuning}
                    qualityProfile={qualityProfile}
                    audioBands={audioBands}
                    beatPulse={beatPulse ?? fallbackMotion}
                    atmosphereEnergy={atmosphereEnergy ?? fallbackMotion}
                    smartAtmosphereEnabled={enableBeatBursts}
                    pointerX={pointerX}
                    pointerY={pointerY}
                    currentTime={currentTime}
                    lines={lines}
                    showLyrics={showLyrics}
                    playing={playing}
                    paused={paused}
                    cameraControlState={cameraControlState}
                />
            )}
            <VignetteOverlay disabled={disableVignette} />
        </div>
    );
};

export default GeometricLayer;
