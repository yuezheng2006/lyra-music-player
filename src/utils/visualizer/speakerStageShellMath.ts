// src/utils/visualizer/speakerStageShellMath.ts
// Soft stage wash for speaker presentation — fog/vignette only, never full-viewport backdrop blur.

export type SpeakerGlassTier = 'full' | 'soft' | 'fog';

export interface SpeakerGlassStyle {
    tier: SpeakerGlassTier;
    /** Kept for callers/tests; always 0 — backdrop-filter is too expensive over particle canvases. */
    backdropBlurPx: number;
    fogOpacity: number;
    vignetteOpacity: number;
    useBackdropFilter: boolean;
}

export interface ResolveSpeakerGlassStyleInput {
    speakerActive: boolean;
    isElectron?: boolean;
    /** geometric quality tier or performance mode hint */
    qualityTier?: 'auto' | 'high' | 'balanced' | 'lite' | string | null;
    reducedMotion?: boolean;
}

/** Picks a cheap stage wash that keeps lyrics readable without taxing GPU/CPU. */
export const resolveSpeakerGlassStyle = (input: ResolveSpeakerGlassStyleInput): SpeakerGlassStyle | null => {
    if (!input.speakerActive) return null;

    if (input.reducedMotion) {
        return {
            tier: 'fog',
            backdropBlurPx: 0,
            fogOpacity: 0.28,
            vignetteOpacity: 0.4,
            useBackdropFilter: false,
        };
    }

    const lite = input.qualityTier === 'lite';
    if (lite || input.isElectron) {
        // Keep lyrics readable, but don't crush React Bits (Particles/Plasma looked "missing").
        return {
            tier: 'soft',
            backdropBlurPx: 0,
            fogOpacity: input.isElectron ? 0.12 : 0.22,
            vignetteOpacity: input.isElectron ? 0.22 : 0.36,
            useBackdropFilter: false,
        };
    }

    return {
        tier: 'full',
        backdropBlurPx: 0,
        fogOpacity: 0.26,
        vignetteOpacity: 0.44,
        useBackdropFilter: false,
    };
};

/** Soften interactive3d bloom / intensity so particles yield to floating lyrics. */
export const resolveSpeakerParticleYield = (input: {
    speakerActive: boolean;
    bloomStrength: number;
    rhythmIntensity: number;
}): { bloomStrength: number; rhythmIntensity: number } => {
    if (!input.speakerActive) {
        return {
            bloomStrength: input.bloomStrength,
            rhythmIntensity: input.rhythmIntensity,
        };
    }

    return {
        bloomStrength: Math.min(input.bloomStrength, 0.42),
        rhythmIntensity: Math.min(input.rhythmIntensity, 0.55),
    };
};
