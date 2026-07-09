import React, { useCallback, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import { shouldRenderMineradioWebGL } from './mineradioPresetMap';
import { useCoverParticleRuntime } from './useCoverParticleRuntime';

// src/components/visualizer/geometric/webgl/CoverParticleWebGLStage.tsx
// WebGL backdrop stage for cover particle visual presets.

interface CoverParticleWebGLStageProps {
    coverUrl?: string | null;
    sceneTuning?: Interactive3dSceneTuning;
    qualityProfile: GeometricQualityProfile;
    audioBands?: AudioBands;
    beatPulse?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    paused?: boolean;
    cameraSnapshotRef?: React.RefObject<InteractiveCameraSnapshot>;
}

export const shouldShowCoverParticleWebGL = (tuning?: Interactive3dSceneTuning): boolean => {
    const preset = normalizeInteractive3dVisualPreset(tuning?.visualPreset);
    const enabled = tuning?.enableCoverParticles ?? true;
    return shouldRenderMineradioWebGL(preset, enabled);
};

const CoverParticleWebGLStage: React.FC<CoverParticleWebGLStageProps> = (props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mountedContainer, setMountedContainer] = useState<HTMLDivElement | null>(null);
    const active = shouldShowCoverParticleWebGL(props.sceneTuning);
    const visualPreset = normalizeInteractive3dVisualPreset(props.sceneTuning?.visualPreset);

    const handleContainerRef = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
        setMountedContainer(node);
    }, []);

    useCoverParticleRuntime({
        containerRef,
        mountedContainer,
        enabled: active,
        ...props,
    });

    if (!active) return null;

    return (
        <div
            ref={handleContainerRef}
            className="absolute inset-0 overflow-hidden z-0 isolate"
            style={{ pointerEvents: 'auto', touchAction: 'none' }}
            data-testid="interactive3d-cover-webgl-stage"
            data-visual-preset={visualPreset}
            aria-hidden
        />
    );
};

export default CoverParticleWebGLStage;
