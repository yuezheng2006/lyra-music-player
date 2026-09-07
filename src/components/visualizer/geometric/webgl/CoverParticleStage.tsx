import React, { useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraControlValue } from '../useInteractiveCameraControl';
import { shouldShowCoverParticleWebGL } from './coverParticleWebGLGateMath';
import { resolveCoverParticlePresetModule } from './presets';
import { useMineradioPlaybackRuntime } from '../mineradio/useMineradioPlaybackRuntime';

// src/components/visualizer/geometric/webgl/CoverParticleStage.tsx
// Sole React WebGL shell for cover / tunnel / galaxy particle presets.

export interface CoverParticleStageProps {
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
    immersiveLyrics?: boolean;
    lyricColumnEndRatio?: number;
    playing?: boolean;
    paused?: boolean;
    cameraControlState?: InteractiveCameraControlValue;
}

const CoverParticleStage: React.FC<CoverParticleStageProps> = ({
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
    immersiveLyrics = false,
    lyricColumnEndRatio,
    playing = true,
    paused = false,
    cameraControlState,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const enabled = shouldShowCoverParticleWebGL(sceneTuning);
    const presetModule = resolveCoverParticlePresetModule(sceneTuning?.visualPreset);

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
        immersiveLyrics,
        lyricColumnEndRatio,
        playing,
        paused,
        cameraSnapshotRef: cameraControlState?.snapshotRef,
    });

    if (!enabled) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden z-[1] isolate"
            style={{
                pointerEvents: 'none',
                touchAction: 'none',
                background: presetModule.resolveStageBackground(),
            }}
            data-testid="mineradio-playback-stage"
            data-visual-preset={presetModule.id}
            data-cover-url={coverUrl ?? ''}
            aria-hidden
        />
    );
};

export default CoverParticleStage;
