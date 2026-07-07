import React, { useMemo, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { Interactive3dSceneTuning, Theme } from '../../../types';
import BackgroundWashLayer from './effects/backgroundWash/BackgroundWashLayer';
import BassRippleLayer from './effects/bassRipple/BassRippleLayer';
import BeatBurstLayer from './effects/beatBurst/BeatBurstLayer';
import BloomParticleLayer from './effects/bloomParticle/BloomParticleLayer';
import FloatingParticleLayer from './effects/floatingParticle/FloatingParticleLayer';
import LyricFocusAuraLayer from './effects/lyricFocusAura/LyricFocusAuraLayer';
import OrbitFieldLayer from './effects/orbitField/OrbitFieldLayer';
import type { GeometricQualityProfile } from './geometricQuality';
import { resolveGeometricQualityProfile } from './geometricQuality';
import { InteractiveBackgroundProvider } from './interactiveBackground/InteractiveBackgroundContext';
import { useInteractiveBackgroundFrame } from './interactiveBackground/useInteractiveBackgroundFrame';
import { shouldShowCoverParticleWebGL } from './webgl/CoverParticleWebGLStage';

// src/components/visualizer/geometric/InteractiveBackgroundCanvas.tsx
// Composes all interactive canvas effects on one shared RAF loop for performance.

interface InteractiveBackgroundCanvasProps {
    theme: Theme;
    seed?: string | number;
    paused?: boolean;
    beatPulse?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    bassLevel?: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    enableBeatBursts?: boolean;
    enableLyricFocusAura?: boolean;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    qualityProfile?: GeometricQualityProfile;
}

const InteractiveBackgroundCanvasInner: React.FC<InteractiveBackgroundCanvasProps> = ({
    theme,
    seed,
    paused = false,
    beatPulse,
    cinemaScale,
    cameraPunch,
    atmosphereEnergy,
    bassLevel,
    pointerX,
    pointerY,
    enableBeatBursts = true,
    enableLyricFocusAura = false,
    interactive3dSceneTuning,
    qualityProfile,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const resolvedProfile = useMemo(
        () => qualityProfile ?? resolveGeometricQualityProfile(),
        [qualityProfile],
    );
    const sceneTuning = interactive3dSceneTuning;
    const webglCoverActive = shouldShowCoverParticleWebGL(sceneTuning);
    const showBackgroundWash = (sceneTuning?.enableBackgroundWash ?? true) && !webglCoverActive;
    const showLyricFocusAura = (sceneTuning?.enableLyricFocusAura ?? enableLyricFocusAura) && !webglCoverActive;
    const showBassRipples = (sceneTuning?.enableBassRipples ?? true) && !webglCoverActive;
    const showOrbitField = (sceneTuning?.enableOrbitField ?? true) && !webglCoverActive;
    const showBeatBursts = (sceneTuning?.enableBeatBursts ?? enableBeatBursts) && !webglCoverActive;
    const showBloomParticles = (sceneTuning?.enableBloomParticles ?? false) && !webglCoverActive;
    const showFloatingParticles = (sceneTuning?.enableFloatingParticles ?? false) && !webglCoverActive;
    const hasActiveCanvasLayers = showBackgroundWash
        || showLyricFocusAura
        || showBassRipples
        || showOrbitField
        || showBeatBursts
        || showBloomParticles
        || showFloatingParticles;

    useInteractiveBackgroundFrame({
        canvasRef,
        theme,
        paused,
        enabled: hasActiveCanvasLayers,
        beatPulse,
        cinemaScale,
        cameraPunch,
        atmosphereEnergy,
        bassLevel,
        pointerX,
        pointerY,
        enableBeatBursts: showBeatBursts,
        qualityProfile: resolvedProfile,
        interactive3dSceneTuning: sceneTuning,
    });

    if (!hasActiveCanvasLayers) {
        return null;
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ zIndex: 1 }}
                aria-hidden
            />
            {showBackgroundWash && <BackgroundWashLayer />}
            {showLyricFocusAura && <LyricFocusAuraLayer />}
            {showBassRipples && <BassRippleLayer qualityProfile={resolvedProfile} />}
            {showOrbitField && <OrbitFieldLayer seed={seed} qualityProfile={resolvedProfile} />}
            {showBloomParticles && (
                <BloomParticleLayer seed={seed} qualityProfile={resolvedProfile} sceneTuning={sceneTuning} />
            )}
            {showFloatingParticles && (
                <FloatingParticleLayer seed={seed} qualityProfile={resolvedProfile} sceneTuning={sceneTuning} />
            )}
            {showBeatBursts && <BeatBurstLayer enabled qualityProfile={resolvedProfile} />}
        </>
    );
};

const InteractiveBackgroundCanvas: React.FC<InteractiveBackgroundCanvasProps> = (props) => (
    <InteractiveBackgroundProvider>
        <InteractiveBackgroundCanvasInner {...props} />
    </InteractiveBackgroundProvider>
);

export default InteractiveBackgroundCanvas;
