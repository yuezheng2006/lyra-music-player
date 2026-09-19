import { DEFAULT_NOMAND_BACKGROUND_TUNING, type NomandBackgroundTuning } from '../../types/nomandBackground';

// src/utils/settings/nomandAppearanceCodec.ts
// Shortcode fields for Nomand visual settings import/export.

export const compressNomandBackground = (t: NomandBackgroundTuning) => ({
    is: t.imageSource,
    e: t.effect,
    dt: t.ditheringType,
    s: t.size,
    cs: t.colorSteps,
    oc: t.originalColors,
    i: t.inverted,
    fgs: t.flutedGlassSize,
    fgd: t.flutedGlassDistortion,
    fgb: t.flutedGlassBlur,
    ptc: t.paperTextureContrast,
    ptr: t.paperTextureRoughness,
    ptf: t.paperTextureFiber,
    hds: t.halftoneDotsSize,
    hdr: t.halftoneDotsRadius,
    hdc: t.halftoneDotsContrast,
    hdoc: t.halftoneDotsOriginalColors,
    hdi: t.halftoneDotsInverted,
    lds: t.lensDistortionSpread,
    ldb: t.lensDistortionBulge,
    ldd: t.lensDistortionDispersion,
    oe: t.overlayEnabled,
    oo: t.overlayOpacity,
});

export const decompressNomandBackground = (o: Record<string, unknown>): Partial<NomandBackgroundTuning> => ({
    imageSource: typeof o.is === 'string' ? o.is as NomandBackgroundTuning['imageSource'] : DEFAULT_NOMAND_BACKGROUND_TUNING.imageSource,
    ...(typeof o.e === 'string' ? { effect: o.e as NomandBackgroundTuning['effect'] } : {}),
    ditheringType: o.dt === '2x2' || o.dt === '4x4' || o.dt === '8x8'
        ? o.dt
        : DEFAULT_NOMAND_BACKGROUND_TUNING.ditheringType,
    size: typeof o.s === 'number' ? o.s : DEFAULT_NOMAND_BACKGROUND_TUNING.size,
    colorSteps: typeof o.cs === 'number' ? o.cs : DEFAULT_NOMAND_BACKGROUND_TUNING.colorSteps,
    originalColors: typeof o.oc === 'boolean' ? o.oc : DEFAULT_NOMAND_BACKGROUND_TUNING.originalColors,
    inverted: typeof o.i === 'boolean' ? o.i : DEFAULT_NOMAND_BACKGROUND_TUNING.inverted,
    flutedGlassSize: typeof o.fgs === 'number' ? o.fgs : DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassSize,
    flutedGlassDistortion: typeof o.fgd === 'number' ? o.fgd : DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassDistortion,
    flutedGlassBlur: typeof o.fgb === 'number' ? o.fgb : DEFAULT_NOMAND_BACKGROUND_TUNING.flutedGlassBlur,
    paperTextureContrast: typeof o.ptc === 'number' ? o.ptc : DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureContrast,
    paperTextureRoughness: typeof o.ptr === 'number' ? o.ptr : DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureRoughness,
    paperTextureFiber: typeof o.ptf === 'number' ? o.ptf : DEFAULT_NOMAND_BACKGROUND_TUNING.paperTextureFiber,
    halftoneDotsSize: typeof o.hds === 'number' ? o.hds : DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsSize,
    halftoneDotsRadius: typeof o.hdr === 'number' ? o.hdr : DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsRadius,
    halftoneDotsContrast: typeof o.hdc === 'number' ? o.hdc : DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsContrast,
    halftoneDotsOriginalColors: typeof o.hdoc === 'boolean' ? o.hdoc : DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsOriginalColors,
    halftoneDotsInverted: typeof o.hdi === 'boolean' ? o.hdi : DEFAULT_NOMAND_BACKGROUND_TUNING.halftoneDotsInverted,
    lensDistortionSpread: typeof o.lds === 'number' ? o.lds : DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionSpread,
    lensDistortionBulge: typeof o.ldb === 'number' ? o.ldb : DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionBulge,
    lensDistortionDispersion: typeof o.ldd === 'number' ? o.ldd : DEFAULT_NOMAND_BACKGROUND_TUNING.lensDistortionDispersion,
    overlayEnabled: typeof o.oe === 'boolean' ? o.oe : DEFAULT_NOMAND_BACKGROUND_TUNING.overlayEnabled,
    overlayOpacity: typeof o.oo === 'number' ? o.oo : DEFAULT_NOMAND_BACKGROUND_TUNING.overlayOpacity,
});
