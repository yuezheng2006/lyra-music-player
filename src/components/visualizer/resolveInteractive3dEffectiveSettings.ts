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
import { shouldShowCoverParticleWebGL } from './geometric/webgl/CoverParticleWebGLStage';

// src/components/visualizer/resolveInteractive3dEffectiveSettings.ts
// Resolves which player-panel settings actually affect the interactive3d WebGL path.

export type Interactive3dBackgroundRenderer =
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
    webglActive: boolean;
    visualPreset: MineradioVisualPresetId | null;
    /** Scene-layer toggles that are persisted but not rendered on the current path. */
    inactiveSceneEffectIds: Interactive3dSceneEffectId[];
    /** Tuning keys that currently influence WebGL cover runtime. */
    activeWebglTuningKeys: Array<keyof Interactive3dSceneTuning>;
    smartAtmosphereAffectsRhythm: boolean;
    fumeDrawsOwnBackground: boolean;
    conflicts: Interactive3dSettingsConflict[];
}

const WEBGL_TUNING_KEYS: Array<keyof Interactive3dSceneTuning> = [
    'visualPreset',
    'enableCoverParticles',
    'rhythmIntensity',
    'bloomStrength',
    'enableBassRipples',
    'qualityTier',
    'cameraControl',
];

const CANVAS_SCENE_EFFECT_IDS = INTERACTIVE3D_SCENE_EFFECTS
    .filter(effect => effect.renderLayer === 'canvas' && effect.id !== 'cover-particles')
    .map(effect => effect.id);

/** GeometricLayer currently renders WebGL cover particles only (canvas stack is unused). */
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
    if (input.paused) return 'static-placeholder';

    return shouldShowCoverParticleWebGL(input.interactive3dSceneTuning)
        ? 'webgl-cover'
        : 'none';
};

/** Returns scene-layer toggles that should be hidden or marked inactive in settings UI. */
export const resolveInactiveInteractive3dSceneEffects = (
    input: Interactive3dEffectiveSettingsInput,
): Interactive3dSceneEffectId[] => {
    if (!isInteractive3dWebGLOnlyPath(input)) return [];

    const inactive = [...CANVAS_SCENE_EFFECT_IDS, 'dom-shapes' as Interactive3dSceneEffectId];
    const preset = input.interactive3dSceneTuning?.visualPreset ?? 'emily';
    if (preset !== 'emily') {
        inactive.push('bass-ripple');
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
            messageFallback: '已关闭封面 WebGL 粒子，3D 交互背景将为空。',
        });
    }

    if (input.enableSmartAtmosphere === false) {
        conflicts.push({
            id: 'smart-atmosphere-off',
            severity: 'info',
            messageFallback: '智能氛围关闭时，封面律动与 beat 驱动会明显减弱，但仍保留基础频谱反应。',
        });
    }

    if (isInteractive3dWebGLOnlyPath(input)) {
        conflicts.push({
            id: 'canvas-layers-unused',
            severity: 'info',
            messageFallback: '当前 3D 交互仅使用 WebGL 视觉风格；高级面板里的 canvas 分层开关不会生效。',
        });

        const preset = input.interactive3dSceneTuning?.visualPreset ?? 'emily';
        if (preset !== 'emily' && input.interactive3dSceneTuning?.enableBassRipples) {
            conflicts.push({
                id: 'bass-ripples-preset-mismatch',
                severity: 'info',
                messageFallback: 'Bass 涟漪仅对「封面」视觉风格生效，星河/隧道会忽略该开关。',
            });
        }
    }

    if (input.visualizerMode === 'monet' && resolvedBackgroundMode === 'interactive3d') {
        conflicts.push({
            id: 'monet-lyrics-with-3d-bg',
            severity: 'info',
            messageFallback: '动画模式为莫奈时，歌词走莫奈样式，背景仍由 3D 交互 WebGL 负责。',
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
    const webglActive = renderer === 'webgl-cover';
    const inactiveSceneEffectIds = webglActive
        ? resolveInactiveInteractive3dSceneEffects(input)
        : [];

    return {
        resolvedBackgroundMode,
        renderer,
        webglActive,
        visualPreset: webglActive
            ? (input.interactive3dSceneTuning?.visualPreset ?? 'emily')
            : null,
        inactiveSceneEffectIds,
        activeWebglTuningKeys: webglActive ? WEBGL_TUNING_KEYS : [],
        smartAtmosphereAffectsRhythm: Boolean(
            input.enableSmartAtmosphere
            && !input.staticMode
            && resolvedBackgroundMode === 'interactive3d',
        ),
        fumeDrawsOwnBackground: resolvedBackgroundMode !== 'interactive3d',
        conflicts: resolveInteractive3dSettingsConflicts(input),
    };
};
