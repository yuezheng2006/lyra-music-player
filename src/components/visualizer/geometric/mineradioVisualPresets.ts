import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
} from '../../../types';

// src/components/visualizer/geometric/mineradioVisualPresets.ts
// Interactive 3D visual preset bundles (cover bloom + Mineradio originals + modern WebGL styles).

export const INTERACTIVE3D_VISUAL_PRESET_OPTIONS: MineradioVisualPresetId[] = [
    'emily',
    'quantumCube',
    'mineradioTunnel',
    'mineradioOrbit',
    'mineradioVinyl',
    'mineradioGalaxy',
];

/** @deprecated use INTERACTIVE3D_VISUAL_PRESET_OPTIONS */
export const MINERADIO_VISUAL_PRESET_OPTIONS = INTERACTIVE3D_VISUAL_PRESET_OPTIONS;

const LEGACY_VISUAL_PRESET_MAP: Record<string, MineradioVisualPresetId> = {
    void: 'emily',
    vinyl: 'quantumCube',
    starfield: 'quantumCube',
    lightflow: 'emily',
    tunnel: 'emily',
    aurora: 'emily',
    terrain: 'emily',
    mineradioVoid: 'emily',
    nebula: 'mineradioGalaxy',
    orbit: 'mineradioOrbit',
    wallpaper: 'mineradioGalaxy',
    requiem: 'emily',
    custom: 'emily',
};

/** Maps stored or legacy preset ids to the shipped visual styles. */
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
    /** 封面粒子：封面点云 + bass 涟漪 + 边缘电光，默认主推样式。 */
    emily: {
        visualPreset: 'emily',
        rhythmIntensity: 0.85,
        cinemaShake: 0.5,
        bloomStrength: 0.92,
        enableBackgroundWash: true,
        enableOrbitField: true,
        enableBassRipples: true,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** @deprecated 旧唱片入口，迁移到量子盒。 */
    starfield: {
        visualPreset: 'quantumCube',
        rhythmIntensity: 1.14,
        cinemaShake: 0.56,
        bloomStrength: 1.24,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
    /** @deprecated 旧光流入口，迁移到封面粒子。 */
    tunnel: {
        visualPreset: 'emily',
        rhythmIntensity: 0.85,
        cinemaShake: 0.5,
        bloomStrength: 0.92,
        enableBackgroundWash: true,
        enableOrbitField: true,
        enableBassRipples: true,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** @deprecated 旧星云入口，迁移到 Mineradio 星河。 */
    nebula: {
        visualPreset: 'mineradioGalaxy',
        rhythmIntensity: 1.02,
        cinemaShake: 0.38,
        bloomStrength: 1.18,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** @deprecated 旧声场入口，迁移到封面粒子。 */
    terrain: {
        visualPreset: 'emily',
        rhythmIntensity: 0.85,
        cinemaShake: 0.5,
        bloomStrength: 0.92,
        enableBackgroundWash: true,
        enableOrbitField: true,
        enableBassRipples: true,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** 量子盒：发光立方体、能量网格和节拍旋转，适合强 3D 背景。 */
    quantumCube: {
        visualPreset: 'quantumCube',
        rhythmIntensity: 1.14,
        cinemaShake: 0.56,
        bloomStrength: 1.24,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** @deprecated 旧极光入口，迁移到封面粒子。 */
    aurora: {
        visualPreset: 'emily',
        rhythmIntensity: 0.85,
        cinemaShake: 0.5,
        bloomStrength: 0.92,
        enableBackgroundWash: true,
        enableOrbitField: true,
        enableBassRipples: true,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** Mineradio 原版滚筒：管道式封面粒子，自旋向前推进。 */
    mineradioTunnel: {
        visualPreset: 'mineradioTunnel',
        rhythmIntensity: 1.04,
        cinemaShake: 0.52,
        bloomStrength: 0.96,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
    /** Mineradio 原版星球：球面封面采样和缓慢自转。 */
    mineradioOrbit: {
        visualPreset: 'mineradioOrbit',
        rhythmIntensity: 0.98,
        cinemaShake: 0.42,
        bloomStrength: 0.92,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
    /** Mineradio 原版虚空：隐藏主粒子，仅保留歌词和自定义背景。 */
    mineradioVoid: {
        visualPreset: 'mineradioVoid',
        rhythmIntensity: 0.70,
        cinemaShake: 0.18,
        bloomStrength: 0.00,
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
    /** Mineradio 原版唱片：圆形封面 + 黑胶沟槽。 */
    mineradioVinyl: {
        visualPreset: 'mineradioVinyl',
        rhythmIntensity: 1.08,
        cinemaShake: 0.44,
        bloomStrength: 0.86,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: false,
        enableCoverParticles: true,
    },
    /** Mineradio 原版星河：壁纸粒子、星尘和封面色流。 */
    mineradioGalaxy: {
        visualPreset: 'mineradioGalaxy',
        rhythmIntensity: 1.02,
        cinemaShake: 0.38,
        bloomStrength: 1.18,
        enableBackgroundWash: true,
        enableOrbitField: false,
        enableBassRipples: false,
        enableBeatBursts: true,
        enableLyricFocusAura: true,
        enableDomShapes: false,
        enableBloomParticles: true,
        enableFloatingParticles: true,
        enableCoverParticles: true,
    },
};

/** @deprecated use INTERACTIVE3D_VISUAL_PRESET_BUNDLES */
export const MINERADIO_VISUAL_PRESET_BUNDLES = INTERACTIVE3D_VISUAL_PRESET_BUNDLES;

/** Applies a visual preset bundle onto the current tuning snapshot. */
export const applyMineradioVisualPreset = (
    preset: MineradioVisualPresetId,
    current: Interactive3dSceneTuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
): Interactive3dSceneTuning => {
    const resolvedPreset = normalizeInteractive3dVisualPreset(preset);
    return {
        ...current,
        ...INTERACTIVE3D_VISUAL_PRESET_BUNDLES[resolvedPreset],
        qualityTier: current.qualityTier,
        visualPreset: resolvedPreset,
    };
};

export const getMineradioPresetLabelFallback = (preset: MineradioVisualPresetId): string => {
    switch (preset) {
        case 'emily':
            return '封面';
        case 'starfield':
            return '量子盒';
        case 'tunnel':
            return '极光带';
        case 'nebula':
            return '星云';
        case 'terrain':
            return '声场';
        case 'quantumCube':
            return '量子盒';
        case 'aurora':
            return '极光带';
        case 'mineradioTunnel':
            return '滚筒';
        case 'mineradioOrbit':
            return '星球';
        case 'mineradioVoid':
            return '虚空';
        case 'mineradioVinyl':
            return '唱片';
        case 'mineradioGalaxy':
            return '星河';
        default:
            return '封面';
    }
};
