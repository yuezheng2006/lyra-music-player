import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { CoverParticleRuntime } from './coverParticleRuntime';
import { isMusicSpectrumActive } from './coverParticleAudioUniforms';

// src/components/visualizer/geometric/webgl/useCoverParticleRuntime.ts
// React hook mounting Mineradio WebGL cover/skull runtime on a container ref.

interface UseCoverParticleRuntimeOptions {
    containerRef: React.RefObject<HTMLElement | null>;
    mountedContainer: HTMLElement | null;
    enabled: boolean;
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

export const useCoverParticleRuntime = ({
    containerRef,
    mountedContainer,
    enabled,
    coverUrl,
    sceneTuning,
    qualityProfile,
    audioBands,
    beatPulse,
    atmosphereEnergy,
    pointerX,
    pointerY,
    paused = false,
    cameraSnapshotRef,
}: UseCoverParticleRuntimeOptions) => {
    const runtimeRef = useRef<CoverParticleRuntime | null>(null);
    const audioBandsRef = useRef(audioBands);
    const pausedRef = useRef(paused);
    audioBandsRef.current = audioBands;
    pausedRef.current = paused;

    useEffect(() => {
        const container = mountedContainer ?? containerRef.current;
        if (!enabled || !container) return undefined;

        const runtime = new CoverParticleRuntime();
        runtimeRef.current = runtime;
        runtime.mount(container);
        runtime.configure(coverUrl ?? null, sceneTuning, qualityProfile);
        runtime.setInputProvider(() => ({
            audioBands: audioBandsRef.current,
            beat: beatPulse?.get() ?? 0,
            atmosphereEnergy: atmosphereEnergy?.get() ?? 0,
            musicActive: isMusicSpectrumActive(audioBandsRef.current),
            pointerX: pointerX.get(),
            pointerY: pointerY.get(),
            pointerActive: Math.abs(pointerX.get()) + Math.abs(pointerY.get()) > 0.02,
            paused: pausedRef.current,
            camera: cameraSnapshotRef?.current,
        }));
        runtime.start();

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            runtime.resize(entry.contentRect.width, entry.contentRect.height);
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            runtime.dispose();
            runtimeRef.current = null;
        };
    }, [
        mountedContainer,
        enabled,
        coverUrl,
        qualityProfile,
        sceneTuning?.visualPreset,
        sceneTuning?.enableCoverParticles,
        containerRef,
    ]);

    useEffect(() => {
        runtimeRef.current?.configure(coverUrl ?? null, sceneTuning, qualityProfile);
    }, [
        coverUrl,
        qualityProfile,
        sceneTuning?.visualPreset,
        sceneTuning?.enableCoverParticles,
        sceneTuning?.rhythmIntensity,
        sceneTuning?.bloomStrength,
        sceneTuning?.enableBassRipples,
    ]);

};
