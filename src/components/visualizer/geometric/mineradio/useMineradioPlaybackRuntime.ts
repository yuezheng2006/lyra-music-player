import { useEffect, useLayoutEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { LyricStageRuntime } from './lyrics/LyricStageRuntime';
import { CoverParticleRuntime } from '../webgl/coverParticleRuntime';
import { isMusicSpectrumActive } from '../webgl/coverParticleAudioUniforms';

// src/components/visualizer/geometric/mineradio/useMineradioPlaybackRuntime.ts
// Mounts Mineradio cover particle WebGL runtime on a container ref.

interface UseMineradioPlaybackRuntimeOptions {
    containerRef: React.RefObject<HTMLElement | null>;
    enabled: boolean;
    coverUrl?: string | null;
    sceneTuning?: Interactive3dSceneTuning;
    qualityProfile: GeometricQualityProfile;
    theme: Theme;
    audioBands?: AudioBands;
    beatPulse?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    currentTime?: MotionValue<number>;
    lines?: Line[];
    showLyrics?: boolean;
    playing?: boolean;
    paused?: boolean;
    cameraSnapshotRef?: React.RefObject<InteractiveCameraSnapshot>;
}

export const useMineradioPlaybackRuntime = ({
    containerRef,
    enabled,
    coverUrl,
    sceneTuning,
    qualityProfile,
    theme,
    audioBands,
    beatPulse,
    atmosphereEnergy,
    pointerX,
    pointerY,
    currentTime,
    lines = [],
    showLyrics = true,
    playing = true,
    paused = false,
    cameraSnapshotRef,
}: UseMineradioPlaybackRuntimeOptions) => {
    const runtimeRef = useRef<CoverParticleRuntime | null>(null);
    const audioBandsRef = useRef(audioBands);
    const pausedRef = useRef(paused);
    const themeRef = useRef(theme);
    const linesRef = useRef(lines);
    const showLyricsRef = useRef(showLyrics);
    const playingRef = useRef(playing);
    audioBandsRef.current = audioBands;
    pausedRef.current = paused;
    themeRef.current = theme;
    linesRef.current = lines;
    showLyricsRef.current = showLyrics;
    playingRef.current = playing;

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!enabled || !container) return undefined;

        const runtime = new CoverParticleRuntime();
        runtimeRef.current = runtime;
        runtime.mount(container);
        runtime.configure(coverUrl ?? null, sceneTuning, qualityProfile);
        runtime.setLyricStageEnabled(false);
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
        runtime.setLyricInputProvider(() => ({
            lines: linesRef.current,
            currentTimeSec: currentTime?.get() ?? 0,
            playing: playingRef.current,
            showLyrics: false,
            palette: LyricStageRuntime.paletteFromTheme(themeRef.current),
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
        enabled,
        coverUrl,
        qualityProfile,
        sceneTuning?.visualPreset,
        sceneTuning?.enableCoverParticles,
        containerRef,
        beatPulse,
        atmosphereEnergy,
        pointerX,
        pointerY,
        currentTime,
        cameraSnapshotRef,
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
