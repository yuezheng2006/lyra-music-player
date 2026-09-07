// src/utils/visualizer/nomandApi.ts
// Public entry for Nomand image-effect math and effect registration.

export {
    getLensDistortionOverscan,
    getPaperTextureOverscan,
    NOMAND_LENS_SHAPE,
    NOMAND_PAPER_TEXTURE_SHAPE,
    resolveDaylightInversion,
    resolveHalftoneInversion,
} from './nomandShaderAdjustments';
export {
    isNomandEffectId,
    listNomandEffectIds,
    NOMAND_BUILTIN_EFFECTS,
    registerNomandEffectId,
} from './nomandEffectRegistry';
export {
    resolveNomandBackgroundEffect,
    resolveNomandBackgroundSource,
    resolveNomandDitheringType,
    resolveNomandImageSource,
    resolveStoredNomandBackgroundTuning,
} from './nomandBackgroundMath';
export {
    DEFAULT_NOMAND_BACKGROUND_TUNING,
    type NomandBackgroundDitheringType,
    type NomandBackgroundEffect,
    type NomandBackgroundSource,
    type NomandBackgroundTuning,
    type NomandBuiltinEffect,
} from '../../types/nomandBackground';
