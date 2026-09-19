import {
    DEFAULT_NOMAND_BACKGROUND_TUNING,
    type NomandBackgroundDitheringType,
    type NomandBackgroundSource,
    type NomandBackgroundTuning,
} from '../../types/nomandBackground';
import { isNomandEffectId } from './nomandEffectRegistry';

// src/utils/visualizer/nomandBackgroundMath.ts
// Clamp, persist, and resolve Nomand image source independently of React.

const clamp = (value: unknown, fallback: number, min: number, max: number) => (
    Math.min(max, Math.max(min, typeof value === 'number' && Number.isFinite(value) ? value : fallback))
);

export const resolveNomandBackgroundSource = (value: unknown): NomandBackgroundSource => (
    value === 'uploaded-global' ? 'uploaded-global' : DEFAULT_NOMAND_BACKGROUND_TUNING.imageSource
);

export const resolveNomandDitheringType = (value: unknown): NomandBackgroundDitheringType => (
    value === '2x2' || value === '4x4' || value === '8x8'
        ? value
        : DEFAULT_NOMAND_BACKGROUND_TUNING.ditheringType
);

export const resolveNomandBackgroundEffect = (value: unknown): NomandBackgroundTuning['effect'] => (
    isNomandEffectId(value) ? value : DEFAULT_NOMAND_BACKGROUND_TUNING.effect
);

export const resolveStoredNomandBackgroundTuning = (
    parsed: Partial<NomandBackgroundTuning> & { ditheringType?: unknown; effect?: unknown },
): NomandBackgroundTuning => ({
    imageSource: resolveNomandBackgroundSource(parsed.imageSource),
    effect: resolveNomandBackgroundEffect(parsed.effect),
    ditheringType: resolveNomandDitheringType(parsed.ditheringType),
    size: clamp(parsed.size, DEFAULT_NOMAND_BACKGROUND_TUNING.size, 0.5, 20),
    colorSteps: Math.round(clamp(parsed.colorSteps, DEFAULT_NOMAND_BACKGROUND_TUNING.colorSteps, 1, 7)),
    originalColors: parsed.originalColors ?? DEFAULT_NOMAND_BACKGROUND_TUNING.originalColors,
    inverted: parsed.inverted ?? DEFAULT_NOMAND_BACKGROUND_TUNING.inverted,
    flutedGlassSize: clamp(parsed.flutedGlassSize, DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassSize, 0.1, 1),
    flutedGlassDistortion: clamp(parsed.flutedGlassDistortion, DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassDistortion, 0, 1),
    flutedGlassBlur: clamp(parsed.flutedGlassBlur, DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassBlur, 0, 1),
    paperTextureContrast: clamp(parsed.paperTextureContrast, DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureContrast, 0, 1),
    paperTextureRoughness: clamp(parsed.paperTextureRoughness, DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureRoughness, 0, 1),
    paperTextureFiber: clamp(parsed.paperTextureFiber, DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureFiber, 0, 1),
    halftoneDotsSize: clamp(parsed.halftoneDotsSize, DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsSize, 0.1, 1),
    halftoneDotsRadius: clamp(parsed.halftoneDotsRadius, DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsRadius, 0.1, 2),
    halftoneDotsContrast: clamp(parsed.halftoneDotsContrast, DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsContrast, 0, 1),
    halftoneDotsOriginalColors: parsed.halftoneDotsOriginalColors ?? DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsOriginalColors,
    halftoneDotsInverted: parsed.halftoneDotsInverted ?? DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsInverted,
    lensDistortionSpread: clamp(parsed.lensDistortionSpread, DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionSpread, 0, 1),
    lensDistortionBulge: clamp(parsed.lensDistortionBulge, DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionBulge, -1, 1),
    lensDistortionDispersion: clamp(parsed.lensDistortionDispersion, DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionDispersion, 0, 1),
    overlayEnabled: typeof parsed.overlayEnabled === 'boolean'
        ? parsed.overlayEnabled
        : DEFAULT_NOMAND_BACKGROUND_TUNING.overlayEnabled,
    overlayOpacity: clamp(parsed.overlayOpacity, DEFAULT_NOMAND_BACKGROUND_TUNING.overlayOpacity, 0, 1),
});

export const resolveNomandImageSource = (input: {
    imageSource: NomandBackgroundSource;
    coverUrl?: string | null;
    uploadedUrl?: string | null;
}): string | null => {
    if (input.imageSource === 'uploaded-global') {
        return input.uploadedUrl || input.coverUrl || null;
    }
    return input.coverUrl || input.uploadedUrl || null;
};
