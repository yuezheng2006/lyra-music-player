import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dCameraControlMode,
    type Interactive3dQualityTier,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
} from '../../../types';
import {
    resolveGeometricQualityProfile,
    type GeometricQualityProfile,
    type GeometricQualityTier,
} from './geometricQuality';
import {
    normalizeInteractive3dVisualPreset,
} from './mineradioVisualPresets';

// src/components/visualizer/geometric/interactive3dSceneRegistry.ts
// Registry mapping 3D scene effect components to settings keys and UI test ids.

export type Interactive3dSceneEffectId =
    | 'background-wash'
    | 'orbit-field'
    | 'bass-ripple'
    | 'beat-burst'
    | 'lyric-focus-aura'
    | 'dom-shapes'
    | 'bloom-particles'
    | 'floating-particles'
    | 'cover-particles';

type Interactive3dSceneBooleanKey = Exclude<
    keyof Interactive3dSceneTuning,
    | 'qualityTier'
    | 'visualPreset'
    | 'rhythmIntensity'
    | 'cinemaShake'
    | 'bloomStrength'
    | 'atmosphereSensitivity'
    | 'cameraPunchStrength'
    | 'shelfMode'
    | 'shelfPresence'
    | 'shelfCameraMode'
    | 'cameraControl'
>;

export const INTERACTIVE3D_CAMERA_CONTROL_OPTIONS: Interactive3dCameraControlMode[] = [
    'auto',
    'orbit',
    'wasd',
    'gesture',
];

const SHELF_MODES = ['off', 'sidebar', 'stage'] as const;
const SHELF_PRESENCE_OPTIONS = ['auto', 'always'] as const;
const SHELF_CAMERA_MODES = ['dynamic', 'static'] as const;

export interface Interactive3dSceneEffectDefinition {
    id: Interactive3dSceneEffectId;
    componentName: string;
    labelKey: string;
    labelFallback: string;
    descriptionKey: string;
    descriptionFallback: string;
    tuningKey: Interactive3dSceneBooleanKey;
    testId: string;
    renderLayer: 'canvas' | 'dom';
}

export const INTERACTIVE3D_SCENE_EFFECTS: Interactive3dSceneEffectDefinition[] = [
    {
        id: 'background-wash',
        componentName: 'BackgroundWashLayer',
        labelKey: 'options.interactive3dEffectBackgroundWash',
        labelFallback: '背景渐变',
        descriptionKey: 'options.interactive3dEffectBackgroundWashDesc',
        descriptionFallback: '主题色渐变底，提供 3D 场景的基础氛围。',
        tuningKey: 'enableBackgroundWash',
        testId: 'interactive3d-effect-background-wash',
        renderLayer: 'canvas',
    },
    {
        id: 'orbit-field',
        componentName: 'OrbitFieldLayer',
        labelKey: 'options.interactive3dEffectOrbitField',
        labelFallback: '轨道粒子',
        descriptionKey: 'options.interactive3dEffectOrbitFieldDesc',
        descriptionFallback: '围绕歌词焦点的星轨粒子场。',
        tuningKey: 'enableOrbitField',
        testId: 'interactive3d-effect-orbit-field',
        renderLayer: 'canvas',
    },
    {
        id: 'bass-ripple',
        componentName: 'BassRippleLayer',
        labelKey: 'options.interactive3dEffectBassRipples',
        labelFallback: '低频涟漪',
        descriptionKey: 'options.interactive3dEffectBassRipplesDesc',
        descriptionFallback: '低音驱动的环形扩散。',
        tuningKey: 'enableBassRipples',
        testId: 'interactive3d-effect-bass-ripples',
        renderLayer: 'canvas',
    },
    {
        id: 'beat-burst',
        componentName: 'BeatBurstLayer',
        labelKey: 'options.interactive3dEffectBeatBursts',
        labelFallback: '节拍粒子',
        descriptionKey: 'options.interactive3dEffectBeatBurstsDesc',
        descriptionFallback: '节拍命中时迸发的短寿命粒子。',
        tuningKey: 'enableBeatBursts',
        testId: 'interactive3d-effect-beat-bursts',
        renderLayer: 'canvas',
    },
    {
        id: 'bloom-particles',
        componentName: 'BloomParticleLayer',
        labelKey: 'options.interactive3dEffectBloomParticles',
        labelFallback: 'Bloom 粒子',
        descriptionKey: 'options.interactive3dEffectBloomParticlesDesc',
        descriptionFallback: '柔光粒子层，增强封面丝绸感。',
        tuningKey: 'enableBloomParticles',
        testId: 'interactive3d-effect-bloom-particles',
        renderLayer: 'canvas',
    },
    {
        id: 'floating-particles',
        componentName: 'FloatingParticleLayer',
        labelKey: 'options.interactive3dEffectFloatingParticles',
        labelFallback: '浮空粒子',
        descriptionKey: 'options.interactive3dEffectFloatingParticlesDesc',
        descriptionFallback: '浮空粒子层，慢速漂移的环境星尘。',
        tuningKey: 'enableFloatingParticles',
        testId: 'interactive3d-effect-floating-particles',
        renderLayer: 'canvas',
    },
    {
        id: 'cover-particles',
        componentName: 'CoverParticleWebGLStage',
        labelKey: 'options.interactive3dEffectCoverParticles',
        labelFallback: '封面 WebGL 粒子',
        descriptionKey: 'options.interactive3dEffectCoverParticlesDesc',
        descriptionFallback: '封面点云、量子盒、星云、声场和极光带粒子，作为 3D 场景主背景。',
        tuningKey: 'enableCoverParticles',
        testId: 'interactive3d-effect-cover-particles',
        renderLayer: 'canvas',
    },
    {
        id: 'lyric-focus-aura',
        componentName: 'LyricFocusAuraLayer',
        labelKey: 'options.interactive3dEffectLyricFocusAura',
        labelFallback: '歌词焦点光晕',
        descriptionKey: 'options.interactive3dEffectLyricFocusAuraDesc',
        descriptionFallback: '歌词区域下方的柔和焦点光，与歌词节奏同步。',
        tuningKey: 'enableLyricFocusAura',
        testId: 'interactive3d-effect-lyric-focus-aura',
        renderLayer: 'canvas',
    },
    {
        id: 'dom-shapes',
        componentName: 'GeometricShapeLayer',
        labelKey: 'options.interactive3dEffectDomShapes',
        labelFallback: '3D 几何体',
        descriptionKey: 'options.interactive3dEffectDomShapesDesc',
        descriptionFallback: '随频段缩放的主题几何图形层。',
        tuningKey: 'enableDomShapes',
        testId: 'interactive3d-effect-dom-shapes',
        renderLayer: 'dom',
    },
];

export const INTERACTIVE3D_QUALITY_TIER_OPTIONS: Interactive3dQualityTier[] = [
    'auto',
    'high',
    'balanced',
    'lite',
];

const clampUnit = (value: number, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
};

const resolveVisualPreset = (value: unknown): MineradioVisualPresetId =>
    normalizeInteractive3dVisualPreset(value);

const resolveQualityTierOverride = (
    tier: Interactive3dQualityTier,
): GeometricQualityTier | undefined => (tier === 'auto' ? undefined : tier);

export const resolveStoredInteractive3dSceneTuning = (
    parsed: Partial<Interactive3dSceneTuning> = {},
): Interactive3dSceneTuning => ({
    qualityTier: INTERACTIVE3D_QUALITY_TIER_OPTIONS.includes(parsed.qualityTier as Interactive3dQualityTier)
        ? (parsed.qualityTier as Interactive3dQualityTier)
        : DEFAULT_INTERACTIVE3D_SCENE_TUNING.qualityTier,
    visualPreset: resolveVisualPreset(parsed.visualPreset),
    rhythmIntensity: clampUnit(
        parsed.rhythmIntensity ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.rhythmIntensity,
        0,
        1,
        DEFAULT_INTERACTIVE3D_SCENE_TUNING.rhythmIntensity,
    ),
    cinemaShake: clampUnit(
        parsed.cinemaShake ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.cinemaShake,
        0,
        1.8,
        DEFAULT_INTERACTIVE3D_SCENE_TUNING.cinemaShake,
    ),
    bloomStrength: clampUnit(
        parsed.bloomStrength ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.bloomStrength,
        0,
        1.6,
        DEFAULT_INTERACTIVE3D_SCENE_TUNING.bloomStrength,
    ),
    atmosphereSensitivity: clampUnit(
        parsed.atmosphereSensitivity ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.atmosphereSensitivity,
        0,
        1.5,
        DEFAULT_INTERACTIVE3D_SCENE_TUNING.atmosphereSensitivity,
    ),
    cameraPunchStrength: clampUnit(
        parsed.cameraPunchStrength ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.cameraPunchStrength,
        0,
        1.5,
        DEFAULT_INTERACTIVE3D_SCENE_TUNING.cameraPunchStrength,
    ),
    shelfMode: SHELF_MODES.includes(parsed.shelfMode as typeof SHELF_MODES[number])
        ? (parsed.shelfMode as typeof SHELF_MODES[number])
        : DEFAULT_INTERACTIVE3D_SCENE_TUNING.shelfMode,
    shelfPresence: SHELF_PRESENCE_OPTIONS.includes(parsed.shelfPresence as typeof SHELF_PRESENCE_OPTIONS[number])
        ? (parsed.shelfPresence as typeof SHELF_PRESENCE_OPTIONS[number])
        : DEFAULT_INTERACTIVE3D_SCENE_TUNING.shelfPresence,
    shelfCameraMode: SHELF_CAMERA_MODES.includes(parsed.shelfCameraMode as typeof SHELF_CAMERA_MODES[number])
        ? (parsed.shelfCameraMode as typeof SHELF_CAMERA_MODES[number])
        : DEFAULT_INTERACTIVE3D_SCENE_TUNING.shelfCameraMode,
    enableBackgroundWash: parsed.enableBackgroundWash ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableBackgroundWash,
    enableOrbitField: parsed.enableOrbitField ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableOrbitField,
    enableBassRipples: parsed.enableBassRipples ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableBassRipples,
    enableBeatBursts: parsed.enableBeatBursts ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableBeatBursts,
    enableLyricFocusAura: parsed.enableLyricFocusAura ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableLyricFocusAura,
    enableDomShapes: parsed.enableDomShapes ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableDomShapes,
    enableBloomParticles: parsed.enableBloomParticles ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableBloomParticles,
    enableFloatingParticles: parsed.enableFloatingParticles ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableFloatingParticles,
    enableCoverParticles: parsed.enableCoverParticles ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING.enableCoverParticles,
    cameraControl: INTERACTIVE3D_CAMERA_CONTROL_OPTIONS.includes(parsed.cameraControl as Interactive3dCameraControlMode)
        ? (parsed.cameraControl as Interactive3dCameraControlMode)
        : DEFAULT_INTERACTIVE3D_SCENE_TUNING.cameraControl,
});

export const resolveInteractive3dQualityProfile = (
    tuning: Interactive3dSceneTuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    viewportArea = 921600,
): GeometricQualityProfile => {
    const profile = resolveGeometricQualityProfile(
        viewportArea,
        resolveQualityTierOverride(tuning.qualityTier),
    );

    return {
        ...profile,
        enableRipples: tuning.enableBassRipples,
        enableBeatBursts: tuning.enableBeatBursts,
        enableDomShapes: tuning.enableDomShapes,
        shapeCount: tuning.enableDomShapes ? Math.max(profile.shapeCount, 8) : 0,
    };
};

export const getInteractive3dSceneEffectDefinition = (id: Interactive3dSceneEffectId) =>
    INTERACTIVE3D_SCENE_EFFECTS.find(effect => effect.id === id);
