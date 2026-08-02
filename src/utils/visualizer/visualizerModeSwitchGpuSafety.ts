import type { VisualizerBackgroundMode, VisualizerMode } from '../../types';
import {
    INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
    INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS,
    shouldYieldInteractive3dParticlesForVisualizerModeSwitch,
} from './yieldInteractive3dParticlesForModeSwitch';

// src/utils/visualizer/visualizerModeSwitchGpuSafety.ts
// Pure GPU-safety policy for lyric visualizer mode switches under interactive3d.

export type VisualizerModeSwitchGpuPlan = {
    /** Same mode — do not touch yield or store. */
    noop: boolean;
    /** Pause particle ticks while DOM lyric modes remount. */
    yieldParticles: boolean;
    /**
     * Apply visualizerMode in the same zustand update as yield.
     * Using startTransition alone can resume GPU before the lyric remount lands.
     */
    applyModeWithYield: boolean;
    settleMs: number;
    menuCloseExtendMs: number;
};

/**
 * GeometricLayer remount key must be seed-only.
 * Encoding visualizerMode here remounts WebGL on every lyric-mode switch (GPU death).
 */
export const resolveGeometricLayerRemountKey = (
    seed: string | number | null | undefined,
): string => String(seed ?? 'default');

/**
 * Concurrent interactive3d ticks + DOM/canvas lyric modes kill the Electron GPU helper
 * (exit_code=512) — especially at play-start when audioSrc unpauses WebGL.
 *
 * Electron: hold particle ticks whenever lyrics are on screen (keep last painted frame).
 * Other runtimes: only the heaviest lyric remounts (cappella / pendolo).
 */
export const shouldHoldInteractive3dParticlesForHeavyLyricMode = (input: {
    backgroundMode: VisualizerBackgroundMode | null | undefined;
    visualizerMode: VisualizerMode | null | undefined;
    isElectron?: boolean;
    /** When false, Electron may resume particle ticks (lyrics hidden escape hatch). */
    lyricsVisible?: boolean;
}): boolean => {
    if (input.backgroundMode !== 'interactive3d' || !input.visualizerMode) {
        return false;
    }

    if (input.isElectron) {
        return input.lyricsVisible !== false;
    }

    return input.visualizerMode === 'cappella' || input.visualizerMode === 'pendolo';
};

/** Combined pause flag consumed by MineradioPlaybackStage (yield OR menu hold OR heavy lyric). */
export const resolveInteractive3dParticlesPaused = (input: {
    yieldInteractive3dParticles: boolean;
    holdInteractive3dParticleYield: boolean;
    backgroundMode?: VisualizerBackgroundMode | null;
    visualizerMode?: VisualizerMode | null;
    isElectron?: boolean;
    lyricsVisible?: boolean;
}): boolean => Boolean(
    input.yieldInteractive3dParticles
    || input.holdInteractive3dParticleYield
    || shouldHoldInteractive3dParticlesForHeavyLyricMode({
        backgroundMode: input.backgroundMode,
        visualizerMode: input.visualizerMode,
        isElectron: input.isElectron,
        lyricsVisible: input.lyricsVisible,
    }),
);

/**
 * Lyric-mode changes must never unmount interactive3d WebGL by themselves.
 * Video stage / background-mode policy may still disable geometry — that is separate.
 */
export const shouldUnmountInteractive3dWebGlForLyricModeChange = (
    _prevMode: VisualizerMode,
    _nextMode: VisualizerMode,
): boolean => false;

/** Plan the store update for a lyric visualizer mode switch. */
export const planVisualizerModeSwitchGpuSafety = (input: {
    prevMode: VisualizerMode;
    nextMode: VisualizerMode;
    backgroundMode: VisualizerBackgroundMode | null | undefined;
}): VisualizerModeSwitchGpuPlan => {
    if (input.prevMode === input.nextMode) {
        return {
            noop: true,
            yieldParticles: false,
            applyModeWithYield: false,
            settleMs: INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS,
            menuCloseExtendMs: INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
        };
    }

    const yieldParticles = shouldYieldInteractive3dParticlesForVisualizerModeSwitch(
        input.backgroundMode,
    );
    // Cappella / Pendolo remount heavier DOM + optional 2D canvas; give WebGL longer to stay paused.
    const heavyLyricRemount = input.nextMode === 'cappella' || input.nextMode === 'pendolo';
    const settleMs = heavyLyricRemount
        ? Math.max(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS, 1400)
        : INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS;

    return {
        noop: false,
        yieldParticles,
        applyModeWithYield: yieldParticles,
        settleMs,
        menuCloseExtendMs: INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
    };
};

/**
 * Fields that may call CoverParticleRuntime.configure without remounting WebGL.
 * Object identity of sceneTuning/qualityProfile must NOT be in this list.
 */
export const INTERACTIVE3D_CONFIGURE_PRIMITIVE_DEP_KEYS = [
    'coverUrl',
    'qualityTier',
    'devicePixelRatioCap',
    'visualPreset',
    'enableCoverParticles',
    'rhythmIntensity',
    'bloomStrength',
    'enableBassRipples',
    'enableBloomParticles',
    'atmosphereSensitivity',
    'cameraPunchStrength',
    'cinemaShake',
] as const;

/**
 * Layout-effect remount triggers for the Mineradio runtime (must stay narrow).
 * visualPreset / enableCoverParticles belong in configure only — remounting WebGL
 * on 封面↔滚筒↔星河 clicks freezes Retina Electron and makes the chip look inert.
 */
export const INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS = [
    'enabled',
    'qualityTier',
    'devicePixelRatioCap',
    'smartAtmosphereEnabled',
] as const;

/** Lyric mode must never appear in WebGL remount or configure dep keys. */
export const assertLyricModeExcludedFromWebGlDeps = (keys: readonly string[]): boolean =>
    !keys.some((key) => key === 'visualizerMode' || key === 'mode');
