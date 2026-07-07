import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
} from '../../../types';

// src/components/visualizer/geometric/mineradioVisualPresets.ts
// Interactive 3D visual preset bundles (cover + starfield + tunnel).

export const INTERACTIVE3D_VISUAL_PRESET_OPTIONS: MineradioVisualPresetId[] = [
    'emily',
    'starfield',
    'tunnel',
];

/** @deprecated use INTERACTIVE3D_VISUAL_PRESET_OPTIONS */
export const MINERADIO_VISUAL_PRESET_OPTIONS = INTERACTIVE3D_VISUAL_PRESET_OPTIONS;

const LEGACY_VISUAL_PRESET_MAP: Record<string, MineradioVisualPresetId> = {
    void: 'emily',
    vinyl: 'tunnel',
    requiem: 'emily',
    custom: 'emily',
};

/** Maps stored or legacy preset ids to the three shipped visual styles. */
export const normalizeInteractive3dVisualPreset = (value: unknown): MineradioVisualPresetId => {
    if (INTERACTIVE3D_VISUAL_PRESET_OPTIONS.includes(value as MineradioVisualPresetId)) {
        return value as MineradioVisualPresetId;
    }
    if (typeof value === 'string' && value in LEGACY_VISUAL_PRESET_MAP) {
        return LEGACY_VISUAL_PRESET_MAP[value];
    }
    return DEFAULT_INTERACTIVE3D_SCENE_TUNING.visualPreset;
};

export const INTERACTIVE3D_VISUAL_PRESET_BUNDLES: Record<
    MineradioVisualPresetId,
    Partial<Interactive3dSceneTuning>
> = {
    /** 封面粒子：深度挤出 + bass 涟漪，默认主推样式。 */
    emily: {
        visualPreset: 'emily',
        rhythmIntensity: 0.85,
        cinemaShake: 0.5,
        bloomStrength: 0.62,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: true,
        enableBeatBursts: false,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: false,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
    /** 星河：螺旋星带 warp，偏环境粒子，关闭额外 canvas 层以控性能。 */
    starfield: {
        visualPreset: 'starfield',
        rhythmIntensity: 0.92,
        cinemaShake: 0.35,
        bloomStrength: 0.78,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: false,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: false,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
    /** 隧道：滚筒纵深，中等律动，无 Emily 涟漪。 */
    tunnel: {
        visualPreset: 'tunnel',
        rhythmIntensity: 0.96,
        cinemaShake: 0.48,
        bloomStrength: 0.58,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: false,
        enableLyricFocusAura: false,
        enableDomShapes: false,
        enableBloomParticles: false,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
};

/** @deprecated use INTERACTIVE3D_VISUAL_PRESET_BUNDLES */
export const MINERADIO_VISUAL_PRESET_BUNDLES = INTERACTIVE3D_VISUAL_PRESET_BUNDLES;

/** Applies a visual preset bundle onto the current tuning snapshot. */
export const applyMineradioVisualPreset = (
    preset: MineradioVisualPresetId,
    current: Interactive3dSceneTuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
): Interactive3dSceneTuning => ({
    ...current,
    ...INTERACTIVE3D_VISUAL_PRESET_BUNDLES[preset],
    qualityTier: current.qualityTier,
    visualPreset: preset,
});

export const getMineradioPresetLabelFallback = (preset: MineradioVisualPresetId): string => {
    switch (preset) {
        case 'emily':
            return '封面';
        case 'starfield':
            return '星河';
        case 'tunnel':
            return '隧道';
        default:
            return '封面';
    }
};
