// Nomand Paper-shader background tuning. Import via nomandApi or types.ts.

export type NomandBackgroundSource = 'cover-derived' | 'uploaded-global';
export type NomandBackgroundDitheringType = '2x2' | '4x4' | '8x8';
export type NomandBuiltinEffect =
    | 'dithering'
    | 'fluted-glass'
    | 'paper-texture'
    | 'halftone-dots'
    | 'lens-distortion';
/** Built-in ids plus plugin-registered effect ids. */
export type NomandBackgroundEffect = NomandBuiltinEffect | (string & {});

export interface NomandBackgroundTuning {
    imageSource: NomandBackgroundSource;
    effect: NomandBackgroundEffect;
    ditheringType: NomandBackgroundDitheringType;
    size: number;
    colorSteps: number;
    originalColors: boolean;
    inverted: boolean;
    flutedGlassSize: number;
    flutedGlassDistortion: number;
    flutedGlassBlur: number;
    paperTextureContrast: number;
    paperTextureRoughness: number;
    paperTextureFiber: number;
    halftoneDotsSize: number;
    halftoneDotsRadius: number;
    halftoneDotsContrast: number;
    halftoneDotsOriginalColors: boolean;
    halftoneDotsInverted: boolean;
    lensDistortionSpread: number;
    lensDistortionBulge: number;
    lensDistortionDispersion: number;
    overlayEnabled: boolean;
    overlayOpacity: number;
}

export const DEFAULT_NOMAND_BACKGROUND_TUNING: NomandBackgroundTuning = {
    imageSource: 'cover-derived',
    effect: 'dithering',
    ditheringType: '8x8',
    size: 3,
    colorSteps: 4,
    originalColors: false,
    inverted: false,
    flutedGlassSize: 0.5,
    flutedGlassDistortion: 0.5,
    flutedGlassBlur: 0.08,
    paperTextureContrast: 0.32,
    paperTextureRoughness: 0.42,
    paperTextureFiber: 0.3,
    halftoneDotsSize: 0.5,
    halftoneDotsRadius: 1.25,
    halftoneDotsContrast: 0.4,
    halftoneDotsOriginalColors: false,
    halftoneDotsInverted: false,
    lensDistortionSpread: 0.45,
    lensDistortionBulge: 0.3,
    lensDistortionDispersion: 0.65,
    overlayEnabled: true,
    overlayOpacity: 0.35,
};
