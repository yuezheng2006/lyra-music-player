// src/utils/performance/monetElectronLiteMath.ts
// Cap Monet canvas/compositor cost on Electron Retina so lyrics stay usable.
// Soft GL / GPU-death sessions cannot afford drop-shadow stacks + canvas RAF.

/** Canvas DPR for the Monet audio rail — uncapped Retina buffers thrash the GPU helper. */
export const resolveMonetAudioCanvasDpr = (input: {
    devicePixelRatio: number;
    isElectron: boolean;
    gpuUnstable?: boolean;
}): number => {
    const raw = Number.isFinite(input.devicePixelRatio) && input.devicePixelRatio > 0
        ? input.devicePixelRatio
        : 1;
    if (!input.isElectron) return Math.min(raw, 2);
    return 1;
};

/** Scale canvas shadowBlur (0 disables glow) on Electron. */
export const resolveMonetAudioShadowBlurScale = (input: {
    isElectron: boolean;
    gpuUnstable?: boolean;
}): number => {
    if (!input.isElectron) return 1;
    return 0;
};

/** Skip every Nth RAF frame on the audio rail under Electron load. */
export const resolveMonetAudioFrameSkip = (input: {
    isElectron: boolean;
    gpuUnstable?: boolean;
}): number => {
    if (!input.isElectron) return 0;
    return input.gpuUnstable ? 3 : 2;
};

/** Electron never runs the live Monet audio RAF loop — it pegs the renderer at 100%. */
export const shouldForceMonetAudioStatic = (input: {
    staticMode: boolean;
    isElectron: boolean;
}): boolean => input.staticMode || input.isElectron;

/**
 * Floating decor FM loops stack poorly with Retina / software-GL compositing.
 * Always static on Electron.
 */
export const shouldUseMonetStaticDecor = (input: {
    staticMode: boolean;
    isElectron: boolean;
    gpuUnstable?: boolean;
}): boolean => {
    void input.gpuUnstable;
    return input.staticMode || input.isElectron;
};

/**
 * Multi drop-shadow karaoke outlines + CSS blur washes freeze Electron after GPU
 * falls back to --use-gl=disabled. Keep glyph color wipe; drop compositor filters.
 */
export const shouldDisableMonetCompositorEffects = (input: {
    isElectron: boolean;
}): boolean => input.isElectron;
