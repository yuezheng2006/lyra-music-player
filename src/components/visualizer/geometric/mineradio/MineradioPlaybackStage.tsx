import React, { useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraControlValue } from '../useInteractiveCameraControl';
import { shouldShowCoverParticleWebGL } from '../webgl/CoverParticleWebGLStage';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
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
    immersiveLyrics?: boolean;
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
    immersiveLyrics = false,
    playing = true,
    paused = false,
    cameraControlState,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const enabled = shouldShowCoverParticleWebGL(sceneTuning);
    const visualPreset = normalizeInteractive3dVisualPreset(sceneTuning?.visualPreset);

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
        playing,
        paused,
        cameraSnapshotRef: cameraControlState?.snapshotRef,
    });

    if (!enabled) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden z-0 isolate"
            style={{
                pointerEvents: 'auto',
                touchAction: 'none',
                background:
                    visualPreset === 'emily'
                        ? 'radial-gradient(circle at 50% 46%, rgba(49, 57, 53, 0.16) 0%, rgba(7, 25, 34, 0.42) 58%, rgba(2, 8, 12, 0.64) 100%)'
                        : 'transparent',
            }}
            data-testid="mineradio-playback-stage"
            data-visual-preset={visualPreset}
            data-cover-url={coverUrl ?? ''}
            aria-hidden
        />
    );
};

export default MineradioPlaybackStage;
