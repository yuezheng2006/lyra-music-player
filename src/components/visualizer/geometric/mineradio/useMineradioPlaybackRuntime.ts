import { useEffect, useLayoutEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { LyricStageRuntime } from './lyrics/LyricStageRuntime';
import { CoverParticleRuntime } from '../webgl/coverParticleRuntime';
import { isMusicSpectrumActive } from '../webgl/coverParticleAudioUniforms';

// src/components/visualizer/geometric/mineradio/useMineradioPlaybackRuntime.ts
// Mounts Mineradio WebGL particle runtime on a container ref.

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
    smartAtmosphereEnabled?: boolean;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    currentTime?: MotionValue<number>;
    lines?: Line[];
    showLyrics?: boolean;
    /** Fullscreen / desktop-lyrics presentation for stage lyrics. */
    immersiveLyrics?: boolean;
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
    smartAtmosphereEnabled = true,
    pointerX,
    pointerY,
    currentTime,
    lines = [],
    showLyrics = true,
    immersiveLyrics = false,
    playing = true,
    paused = false,
    cameraSnapshotRef,
}: UseMineradioPlaybackRuntimeOptions) => {
    const coverRuntimeRef = useRef<CoverParticleRuntime | null>(null);
    const audioBandsRef = useRef(audioBands);
    const pausedRef = useRef(paused);
    const themeRef = useRef(theme);
    const linesRef = useRef(lines);
    const showLyricsRef = useRef(showLyrics);
    const immersiveLyricsRef = useRef(immersiveLyrics);
    const playingRef = useRef(playing);
    audioBandsRef.current = audioBands;
    pausedRef.current = paused;
    themeRef.current = theme;
    linesRef.current = lines;
    showLyricsRef.current = showLyrics;
    immersiveLyricsRef.current = immersiveLyrics;
    playingRef.current = playing;

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!enabled || !container) return undefined;

        const runtime = new CoverParticleRuntime();
        coverRuntimeRef.current = runtime;
        runtime.mount(container);
        runtime.configure(coverUrl ?? null, sceneTuning, qualityProfile);
        runtime.setLyricStageEnabled(showLyricsRef.current);
        runtime.setLyricImmersive(immersiveLyricsRef.current);
        runtime.setInputProvider(() => ({
            audioBands: audioBandsRef.current,
            beat: smartAtmosphereEnabled ? (beatPulse?.get() ?? 0) : 0,
            atmosphereEnergy: smartAtmosphereEnabled ? (atmosphereEnergy?.get() ?? 0) : 0,
            smartAtmosphereEnabled,
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
            showLyrics: showLyricsRef.current,
            palette: LyricStageRuntime.paletteFromTheme(themeRef.current),
        }));
        runtime.start();

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            coverRuntimeRef.current?.resize(entry.contentRect.width, entry.contentRect.height);
        });
        observer.observe(container);

        const syncSizeFromContainer = () => {
            const width = container.clientWidth || container.getBoundingClientRect().width;
            const height = container.clientHeight || container.getBoundingClientRect().height;
            coverRuntimeRef.current?.resize(width, height);
        };
        window.addEventListener('resize', syncSizeFromContainer);
        document.addEventListener('fullscreenchange', syncSizeFromContainer);
        // Sidebar / immersive chrome can change the flex stage without a window resize event.
        requestAnimationFrame(syncSizeFromContainer);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', syncSizeFromContainer);
            document.removeEventListener('fullscreenchange', syncSizeFromContainer);
            coverRuntimeRef.current?.dispose();
            coverRuntimeRef.current = null;
        };
    // Intentionally omit coverUrl: remounting WebGL on track change flashes the load mist.
    // Cover updates go through the configure() effect below.
    }, [
        enabled,
        qualityProfile,
        sceneTuning?.visualPreset,
        sceneTuning?.enableCoverParticles,
        containerRef,
        beatPulse,
        atmosphereEnergy,
        smartAtmosphereEnabled,
        pointerX,
        pointerY,
        currentTime,
        cameraSnapshotRef,
    ]);

    useEffect(() => {
        coverRuntimeRef.current?.configure(coverUrl ?? null, sceneTuning, qualityProfile);
    }, [
        coverUrl,
        qualityProfile,
        sceneTuning?.visualPreset,
        sceneTuning?.enableCoverParticles,
        sceneTuning?.rhythmIntensity,
        sceneTuning?.bloomStrength,
        sceneTuning?.enableBassRipples,
    ]);

    useEffect(() => {
        coverRuntimeRef.current?.setLyricStageEnabled(showLyrics);
    }, [showLyrics]);

    useEffect(() => {
        coverRuntimeRef.current?.setLyricImmersive(immersiveLyrics);
    }, [immersiveLyrics]);
};
