import React, { useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraControlValue } from '../useInteractiveCameraControl';
import { shouldShowCoverParticleWebGL } from '../webgl/CoverParticleWebGLStage';
import { useMineradioPlaybackRuntime } from './useMineradioPlaybackRuntime';

// src/components/visualizer/geometric/mineradio/MineradioPlaybackStage.tsx
// Mineradio WebGL cover particle backdrop (cover / vinyl / lightflow).

interface MineradioPlaybackStageProps {
    theme: Theme;
    coverUrl?: string | null;
    sceneTuning?: Interactive3dSceneTuning;
    qualityProfile: GeometricQualityProfile;
    audioBands?: AudioBands;
    beatPulse?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    smartAtmosphereEnabled?: boolean;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    currentTime?: MotionValue<number>;
    lines?: Line[];
    showLyrics?: boolean;
    playing?: boolean;
    paused?: boolean;
    cameraControlState?: InteractiveCameraControlValue;
}

const MineradioPlaybackStage: React.FC<MineradioPlaybackStageProps> = ({
    theme,
    coverUrl,
    sceneTuning,
    qualityProfile,
    audioBands,
    beatPulse,
    atmosphereEnergy,
    smartAtmosphereEnabled = true,
    pointerX,
    pointerY,
    currentTime,
    lines = [],
    showLyrics = true,
    playing = true,
    paused = false,
    cameraControlState,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const enabled = shouldShowCoverParticleWebGL(sceneTuning);

    useMineradioPlaybackRuntime({
        containerRef,
        enabled,
        coverUrl,
        sceneTuning,
        qualityProfile,
        theme,
        audioBands,
        beatPulse,
        atmosphereEnergy,
        smartAtmosphereEnabled,
        pointerX,
        pointerY,
        currentTime,
        lines,
        showLyrics,
        playing,
        paused,
        cameraSnapshotRef: cameraControlState?.snapshotRef,
    });

    if (!enabled) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden z-0 isolate"
            data-testid="mineradio-playback-stage"
            aria-hidden
        />
    );
};

export default MineradioPlaybackStage;
