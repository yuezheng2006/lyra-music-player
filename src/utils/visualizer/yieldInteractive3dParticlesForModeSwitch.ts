import type { VisualizerBackgroundMode } from '../../types';

// src/utils/visualizer/yieldInteractive3dParticlesForModeSwitch.ts
// Keep the WebGL context mounted; only pause particle ticks while lyric modes remount.

let resumeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Settle window after a lyric-mode swap.
 * Must outlast startTransition deferral + heavy DOM lyric mount (fume/partita),
 * otherwise GPU resumes mid-remount and Retina Electron freezes / kills the GPU helper.
 */
export const INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS = 900;

/** Extra hold after the background menu closes so close + remount do not overlap GPU ticks. */
export const INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS = 500;

/**
 * Play-start settle: audioSrc unpause + cover texture upload + lyric mount must not share a GPU frame.
 * Continuous lyric hold may keep particles paused after this window; this covers the arming race.
 */
export const INTERACTIVE3D_PLAY_START_YIELD_MS = 2000;

/** Heavy WebGL backgrounds that should yield particle work during lyric remounts. */
export const shouldYieldInteractive3dParticlesForVisualizerModeSwitch = (
    backgroundMode: VisualizerBackgroundMode | null | undefined,
): boolean => backgroundMode === 'interactive3d';

/** Schedule clearing the yield flag after the settle window (resets on rapid switches). */
export const scheduleInteractive3dParticleYieldResume = (input: {
    setYielding: (yielding: boolean) => void;
    yieldMs?: number;
}): void => {
    if (resumeTimer != null) {
        clearTimeout(resumeTimer);
    }
    const ms = input.yieldMs ?? INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS;
    resumeTimer = setTimeout(() => {
        resumeTimer = null;
        input.setYielding(false);
    }, ms);
};

/**
 * Arm a particle-yield window. Returns true when yield was started.
 * Does not unmount WebGL — only flips a paused/yield flag consumed by the shell.
 */
export const armInteractive3dParticleYieldForModeSwitch = (input: {
    backgroundMode: VisualizerBackgroundMode | null | undefined;
    setYielding: (yielding: boolean) => void;
    yieldMs?: number;
}): boolean => {
    if (!shouldYieldInteractive3dParticlesForVisualizerModeSwitch(input.backgroundMode)) {
        return false;
    }
    input.setYielding(true);
    scheduleInteractive3dParticleYieldResume({
        setYielding: input.setYielding,
        yieldMs: input.yieldMs,
    });
    return true;
};

/**
 * Extend yield without requiring a background-mode check (menu close / late remount).
 * Safe to call repeatedly; each call resets the resume timer.
 */
export const extendInteractive3dParticleYield = (input: {
    setYielding: (yielding: boolean) => void;
    yieldMs?: number;
}): void => {
    input.setYielding(true);
    scheduleInteractive3dParticleYieldResume({
        setYielding: input.setYielding,
        yieldMs: input.yieldMs ?? INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
    });
};

/** Test helper — clear pending resume timer between cases. */
export const clearInteractive3dParticleYieldTimer = (): void => {
    if (resumeTimer != null) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
    }
};
