import React from 'react';
import { motion, type MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Theme } from '../../../types';
import InteractiveBackgroundCanvas from './InteractiveBackgroundCanvas';
import CoverParticleWebGLStage from './webgl/CoverParticleWebGLStage';
import type { GeometricQualityProfile } from './geometricQuality';
import { useInteractiveSceneMotion } from './InteractiveSceneMotionContext';
import GeometricShapeLayer from './layers/GeometricShapeLayer';
import PlaylistShelfWebGLStage from './shelf/PlaylistShelfWebGLStage';
import type { BackgroundShape } from './types';
import { useBeatBoostedScales } from './useBeatBoostedScales';
import { useInteractiveSceneTransforms } from './useInteractiveSceneTransforms';
import type { InteractiveCameraControlValue } from './useInteractiveCameraControl';
import VignetteOverlay from './VignetteOverlay';

// src/components/visualizer/geometric/AnimatedGeometricScene.tsx
// Live audio-reactive geometric background composed from modular effect layers.

interface AnimatedGeometricSceneProps {
    theme: Theme;
    audioPower: MotionValue<number>;
    audioBands?: AudioBands;
    beatPulse?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    sceneParallaxX?: MotionValue<number>;
    sceneParallaxY?: MotionValue<number>;
    sceneRoll?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    enableBeatBursts?: boolean;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    qualityProfile: GeometricQualityProfile;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    seed?: string | number;
    shapes: BackgroundShape[];
    hideShapes: boolean;
    disableVignette: boolean;
    paused: boolean;
    coverUrl?: string | null;
    playlistShelfItems?: import('./shelf/shelfTypes').PlaylistShelfItem[];
    cameraControlState?: InteractiveCameraControlValue;
    minimalMotion?: boolean;
}

const AnimatedGeometricScene: React.FC<AnimatedGeometricSceneProps> = ({
    theme,
    audioPower,
    audioBands,
    beatPulse,
    cinemaScale,
    cameraPunch,
    sceneParallaxX,
    sceneParallaxY,
    sceneRoll,
    atmosphereEnergy,
    enableBeatBursts = true,
    interactive3dSceneTuning,
    qualityProfile,
    pointerX,
    pointerY,
    seed,
    shapes,
    hideShapes,
    disableVignette,
    paused,
    coverUrl,
    playlistShelfItems = [],
    cameraControlState,
    minimalMotion = false,
}) => {
    const sharedMotion = useInteractiveSceneMotion();
    const localTransforms = useInteractiveSceneTransforms({
        audioPower,
        pointerX,
        pointerY,
        beatPulse,
        cinemaScale,
        cameraPunch,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
        atmosphereEnergy,
        cinemaShake: interactive3dSceneTuning?.cinemaShake ?? 0.5,
        rhythmIntensity: interactive3dSceneTuning?.rhythmIntensity ?? 0.85,
        userRotateX: cameraControlState?.userRotateX,
        userRotateY: cameraControlState?.userRotateY,
        suppressPointerTilt: cameraControlState?.suppressPointerTilt,
        enabled: !minimalMotion,
    });
    const transforms = sharedMotion?.transforms ?? localTransforms;
    const scales = useBeatBoostedScales(
        audioPower,
        audioBands,
        beatPulse,
        cinemaScale,
        cameraPunch,
        !minimalMotion,
    );

    const canvasLayers = (
        <>
            <InteractiveBackgroundCanvas
                theme={theme}
                seed={seed}
                paused={paused}
                beatPulse={beatPulse}
                cinemaScale={cinemaScale}
                cameraPunch={cameraPunch}
                atmosphereEnergy={atmosphereEnergy}
                bassLevel={audioBands?.bass}
                pointerX={pointerX}
                pointerY={pointerY}
                enableBeatBursts={enableBeatBursts}
                interactive3dSceneTuning={interactive3dSceneTuning}
                qualityProfile={qualityProfile}
                enableLyricFocusAura={!minimalMotion}
            />

            {!hideShapes && !minimalMotion && (
                <GeometricShapeLayer
                    theme={theme}
                    shapes={shapes}
                    scales={scales}
                />
            )}
        </>
    );

    return (
        <div className="absolute inset-0">
            <CoverParticleWebGLStage
                coverUrl={coverUrl}
                sceneTuning={interactive3dSceneTuning}
                qualityProfile={qualityProfile}
                audioBands={audioBands}
                beatPulse={beatPulse}
                atmosphereEnergy={atmosphereEnergy}
                pointerX={pointerX}
                pointerY={pointerY}
                paused={paused}
                cameraSnapshotRef={cameraControlState?.snapshotRef}
            />

            {minimalMotion ? (
                <div className="absolute inset-0 z-[1] pointer-events-none">
                    {canvasLayers}
                </div>
            ) : (
                <motion.div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{
                        transformStyle: 'preserve-3d',
                        x: transforms.sceneX,
                        y: transforms.sceneY,
                        rotateX: transforms.tiltX,
                        rotateY: transforms.tiltY,
                        rotate: transforms.sceneRotate,
                        scale: transforms.sceneScale,
                    }}
                >
                    {canvasLayers}
                </motion.div>
            )}

            {!minimalMotion && (
                <PlaylistShelfWebGLStage
                    items={playlistShelfItems}
                    sceneTuning={interactive3dSceneTuning}
                    theme={theme}
                    paused={paused}
                />
            )}

            <VignetteOverlay disabled={disableVignette} />
        </div>
    );
};

export default AnimatedGeometricScene;
