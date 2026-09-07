import type {
    Interactive3dSceneTuning,
    MineradioVisualPresetId,
    VisualizerBackgroundMode,
    VisualizerMode,
} from '../../types';
import { resolveVisualizerBackgroundMode } from '../../stores/useSettingsUiStore';
import {
    INTERACTIVE3D_SCENE_EFFECTS,
    type Interactive3dSceneEffectId,
} from './geometric/interactive3dSceneRegistry';
import { normalizeInteractive3dVisualPreset } from './geometric/mineradioVisualPresets';
import { shouldShowCoverParticleWebGL } from './geometric/webgl/coverParticleWebGLGateMath';

// src/components/visualizer/resolveInteractive3dEffectiveSettings.ts
// Resolves which player-panel settings actually affect the interactive3d cover stage.

export type Interactive3dBackgroundRenderer =
    | 'cover-atmosphere'
    | 'dom-cover'
    | 'webgl-cover'
    | 'static-placeholder'
    | 'none';

export type Interactive3dSettingsConflictSeverity = 'info' | 'warning';

export interface Interactive3dSettingsConflict {
    id: string;
    severity: Interactive3dSettingsConflictSeverity;
    messageFallback: string;
}

export interface Interactive3dEffectiveSettingsInput {
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    visualizerMode: VisualizerMode;
    staticMode?: boolean;
    disableGeometricBackground?: boolean;
    paused?: boolean;
    enableSmartAtmosphere?: boolean;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
}

export interface Interactive3dEffectiveSettings {
    resolvedBackgroundMode: VisualizerBackgroundMode;
    renderer: Interactive3dBackgroundRenderer;
    /** True when a WebGL canvas background stage is live. */
    webglActive: boolean;
    visualPreset: MineradioVisualPresetId | null;
    /** Scene-layer toggles that are persisted but not rendered on the current path. */
    inactiveSceneEffectIds: Interactive3dSceneEffectId[];
    /** Tuning keys that currently influence the live cover runtime. */
    activeWebglTuningKeys: Array<keyof Interactive3dSceneTuning>;
    smartAtmosphereAffectsRhythm: boolean;
    fumeDrawsOwnBackground: boolean;
    conflicts: Interactive3dSettingsConflict[];
}

const COVER_ATMOSPHERE_TUNING_KEYS: Array<keyof Interactive3dSceneTuning> = [
    'visualPreset',
    'enableCoverParticles',
    'rhythmIntensity',
    'atmosphereSensitivity',
    'qualityTier',
];

const LEGACY_WEBGL_TUNING_KEYS: Array<keyof Interactive3dSceneTuning> = [
    ...COVER_ATMOSPHERE_TUNING_KEYS,
    'cinemaShake',
    'cameraPunchStrength',
    'cameraControl',
    'bloomStrength',
    'enableBassRipples',
];

/** interactive3d uses a soft cover-atmosphere stage by default; canvas stack stays unused. */
export const isInteractive3dWebGLOnlyPath = (
    input: Pick<Interactive3dEffectiveSettingsInput, 'visualizerBackgroundMode' | 'visualizerMode'>,
): boolean => resolveVisualizerBackgroundMode(
    input.visualizerBackgroundMode,
    input.visualizerMode,
) === 'interactive3d';

export const resolveInteractive3dBackgroundRenderer = (
    input: Interactive3dEffectiveSettingsInput,
): Interactive3dBackgroundRenderer => {
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(
        input.visualizerBackgroundMode,
        input.visualizerMode,
    );

    if (resolvedBackgroundMode !== 'interactive3d') return 'none';
    if (input.staticMode || input.disableGeometricBackground) return 'none';
    if (input.interactive3dSceneTuning?.enableCoverParticles === false) return 'none';
    if (input.paused) return 'static-placeholder';

    return shouldShowCoverParticleWebGL(input.interactive3dSceneTuning)
        ? 'webgl-cover'
        : 'cover-atmosphere';
};

/** Returns scene-layer toggles that should be hidden or marked inactive in settings UI. */
export const resolveInactiveInteractive3dSceneEffects = (
    input: Interactive3dEffectiveSettingsInput,
): Interactive3dSceneEffectId[] => {
    if (!isInteractive3dWebGLOnlyPath(input)) return [];

    const inactive = INTERACTIVE3D_SCENE_EFFECTS
        .filter(effect => effect.implementationKind === 'canvas-dead')
        .map(effect => effect.id);
    const legacyWebgl = shouldShowCoverParticleWebGL(input.interactive3dSceneTuning);
    // Bass / bloom stay legacy CoverParticle-only; hide on the default cover-atmosphere path.
    if (!legacyWebgl) {
        inactive.push('bass-ripple', 'bloom-particles');
    } else {
        const preset = normalizeInteractive3dVisualPreset(input.interactive3dSceneTuning?.visualPreset);
        if (preset !== 'emily') {
            inactive.push('bass-ripple');
        }
    }
    return inactive;
};

export const shouldShowInteractive3dSceneLayerToggle = (
    effectId: Interactive3dSceneEffectId,
    input: Interactive3dEffectiveSettingsInput,
): boolean => !resolveInactiveInteractive3dSceneEffects(input).includes(effectId);

export const resolveInteractive3dSettingsConflicts = (
    input: Interactive3dEffectiveSettingsInput,
): Interactive3dSettingsConflict[] => {
    const conflicts: Interactive3dSettingsConflict[] = [];
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(
        input.visualizerBackgroundMode,
        input.visualizerMode,
    );

    if (resolvedBackgroundMode !== 'interactive3d') {
        return conflicts;
    }

    if (input.interactive3dSceneTuning?.enableCoverParticles === false) {
        conflicts.push({
            id: 'cover-particles-disabled',
            severity: 'warning',
            messageFallback: '已关闭封面舞台，3D 交互背景将为空。',
        });
    }

    if (input.enableSmartAtmosphere === false) {
        conflicts.push({
            id: 'smart-atmosphere-off',
            severity: 'info',
            messageFallback: '智能氛围关闭时，封面律动与 beat 驱动会明显减弱，但仍保留基础频谱反应。',
        });
    }

    if (isInteractive3dWebGLOnlyPath(input) && shouldShowCoverParticleWebGL(input.interactive3dSceneTuning)) {
        const preset = normalizeInteractive3dVisualPreset(input.interactive3dSceneTuning?.visualPreset);
        if (preset !== 'emily' && input.interactive3dSceneTuning?.enableBassRipples) {
            conflicts.push({
                id: 'bass-ripples-preset-mismatch',
                severity: 'info',
                messageFallback: 'Bass 涟漪仅对「封面」视觉风格生效，唱片/光流会忽略该开关。',
            });
        }
    }

    if (input.visualizerMode === 'monet' && resolvedBackgroundMode === 'interactive3d') {
        conflicts.push({
            id: 'monet-lyrics-with-3d-bg',
            severity: 'info',
            messageFallback: '动画模式为莫奈时，歌词走莫奈样式，背景仍由 3D 交互封面舞台负责。',
        });
    }

    if (input.paused) {
        conflicts.push({
            id: 'background-paused-off-player',
            severity: 'info',
            messageFallback: '离开播放页时 3D 背景会暂停为静态占位，不代表音乐已暂停。',
        });
    }

    return conflicts;
};

export const resolveInteractive3dEffectiveSettings = (
    input: Interactive3dEffectiveSettingsInput,
): Interactive3dEffectiveSettings => {
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(
        input.visualizerBackgroundMode,
        input.visualizerMode,
    );
    const renderer = resolveInteractive3dBackgroundRenderer(input);
    const coverStageActive = renderer === 'cover-atmosphere' || renderer === 'webgl-cover' || renderer === 'dom-cover';
    const webglActive = renderer === 'webgl-cover';
    const inactiveSceneEffectIds = coverStageActive
        ? resolveInactiveInteractive3dSceneEffects(input)
        : [];

    return {
        resolvedBackgroundMode,
        renderer,
        webglActive,
        visualPreset: coverStageActive
            ? normalizeInteractive3dVisualPreset(input.interactive3dSceneTuning?.visualPreset)
            : null,
        inactiveSceneEffectIds,
        activeWebglTuningKeys: renderer === 'webgl-cover'
            ? LEGACY_WEBGL_TUNING_KEYS
            : renderer === 'cover-atmosphere'
                ? COVER_ATMOSPHERE_TUNING_KEYS
                : [],
        smartAtmosphereAffectsRhythm: Boolean(
            input.enableSmartAtmosphere
            && !input.staticMode
            && resolvedBackgroundMode === 'interactive3d'
            && coverStageActive,
        ),
        fumeDrawsOwnBackground: resolvedBackgroundMode !== 'interactive3d',
        conflicts: resolveInteractive3dSettingsConflicts(input),
    };
};
