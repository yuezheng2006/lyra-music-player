import React from 'react';
import { Monitor, RotateCcw } from 'lucide-react';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dCameraControlMode,
    type Interactive3dQualityTier,
    type Interactive3dSceneTuning,
    type Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import {
    INTERACTIVE3D_CAMERA_CONTROL_OPTIONS,
    INTERACTIVE3D_QUALITY_TIER_OPTIONS,
    INTERACTIVE3D_SCENE_EFFECTS,
} from '../geometric/interactive3dSceneRegistry';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../geometric/mineradioVisualPresets';
import {
    isInteractive3dWebGLOnlyPath,
    resolveInteractive3dEffectiveSettings,
    shouldShowInteractive3dSceneLayerToggle,
} from '../resolveInteractive3dEffectiveSettings';
import Interactive3dShelfSettingsSection from './Interactive3dShelfSettingsSection';

// src/components/visualizer/backgrounds/Interactive3dBackgroundSettingsCard.tsx
// Settings card for interactive 3D background scene layers and quality tier.

interface Interactive3dBackgroundSettingsCardProps {
    t: (key: string) => string;
    theme: Theme;
    controlCardBg: string;
    isDaylight: boolean;
    tuning?: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    onResetTuning?: () => void;
    enableSmartAtmosphere: boolean;
    onToggleEnableSmartAtmosphere?: (enabled: boolean) => void;
    disableVisualizerVignette: boolean;
    onToggleDisableVisualizerVignette?: (disabled: boolean) => void;
}

interface ToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    theme: Theme;
    testId?: string;
}

const SectionLabel: React.FC<{ children: React.ReactNode; theme: Theme; }> = ({ children, theme }) => (
    <div className="text-xs font-medium uppercase tracking-[0.24em] opacity-45" style={{ color: theme.secondaryColor }}>
        {children}
    </div>
);

const ToggleRow: React.FC<ToggleRowProps> = ({
    label,
    description,
    checked,
    onChange,
    theme,
    testId,
}) => (
    <div className="flex items-center justify-between gap-4" data-testid={testId}>
        <div className="space-y-1">
            <div className="text-sm font-medium flex items-center gap-2" style={{ color: theme.primaryColor }}>
                <Monitor size={14} />
                {label}
            </div>
            {description && (
                <div className="text-xs opacity-70 max-w-[320px]" style={{ color: theme.secondaryColor }}>
                    {description}
                </div>
            )}
        </div>
        <button
            type="button"
            aria-pressed={checked}
            onClick={() => onChange?.(!checked)}
            className="w-12 h-6 rounded-full p-1 transition-colors shrink-0 disabled:opacity-45"
            disabled={!onChange}
            style={{
                backgroundColor: checked ? theme.secondaryColor : colorWithAlpha(theme.secondaryColor, 0.18),
            }}
        >
            <div
                className={`w-4 h-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
                style={{ backgroundColor: theme.backgroundColor }}
            />
        </button>
    </div>
);

const getQualityTierLabel = (
    tier: Interactive3dQualityTier,
    t: (key: string) => string,
) => {
    switch (tier) {
        case 'auto':
            return t('options.interactive3dQualityAuto') || '自动';
        case 'high':
            return t('options.interactive3dQualityHigh') || '高';
        case 'balanced':
            return t('options.interactive3dQualityBalanced') || '均衡';
        case 'lite':
            return t('options.interactive3dQualityLite') || '轻量';
        default:
            return tier;
    }
};

const getCameraControlLabel = (
    mode: Interactive3dCameraControlMode,
    t: (key: string) => string,
) => {
    switch (mode) {
        case 'auto':
            return t('options.interactive3dCameraControlAuto') || '自动';
        case 'orbit':
            return t('options.interactive3dCameraControlOrbit') || '轨道拖拽';
        case 'wasd':
            return t('options.interactive3dCameraControlWasd') || 'WASD 自由';
        case 'gesture':
            return t('options.interactive3dCameraControlGesture') || '手势旋转';
        default:
            return mode;
    }
};

export const Interactive3dBackgroundSettingsCard: React.FC<Interactive3dBackgroundSettingsCardProps> = ({
    t,
    theme,
    controlCardBg,
    isDaylight,
    tuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    onTuningChange,
    onResetTuning,
    enableSmartAtmosphere,
    onToggleEnableSmartAtmosphere,
    disableVisualizerVignette,
    onToggleDisableVisualizerVignette,
}) => {
    const effectiveSettingsInput = {
        visualizerBackgroundMode: 'interactive3d' as const,
        visualizerMode: 'classic' as const,
        enableSmartAtmosphere,
        interactive3dSceneTuning: tuning,
    };
    const effectiveSettings = resolveInteractive3dEffectiveSettings(effectiveSettingsInput);
    const webglOnlyPath = isInteractive3dWebGLOnlyPath(effectiveSettingsInput);
    const visibleSceneEffects = INTERACTIVE3D_SCENE_EFFECTS.filter(effect => (
        shouldShowInteractive3dSceneLayerToggle(effect.id, effectiveSettingsInput)
    ));

    return (
    <div
        className="rounded-[24px] border p-4 space-y-5"
        style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}
        data-testid="interactive3d-settings-card"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
                <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                    {t('options.interactive3dSceneSettings') || '3D 场景'}
                </div>
                <div className="text-xs opacity-70 max-w-[360px]" style={{ color: theme.secondaryColor }}>
                    {webglOnlyPath
                        ? (t('options.interactive3dWebglOnlyDesc') || '当前 3D 交互由 WebGL 视觉风格驱动；下方仅保留仍生效的选项。')
                        : (t('options.interactive3dSceneSettingsDesc') || '按组件开关 3D 背景层，并与歌词共用同一套节奏曲线。')}
                </div>
            </div>
            <button
                type="button"
                onClick={onResetTuning}
                disabled={!onResetTuning}
                data-testid="interactive3d-settings-reset"
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                    color: theme.secondaryColor,
                    borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
                    backgroundColor: colorWithAlpha(theme.backgroundColor, 0.22),
                }}
            >
                <RotateCcw size={12} />
                {t('ui.default') || '默认'}
            </button>
        </div>

        <ToggleRow
            label={t('options.enableSmartAtmosphere') || '智能氛围'}
            description={t('options.enableSmartAtmosphereDesc') || '根据节拍与歌曲情绪驱动 3D 背景粒子、涟漪和镜头 punch。'}
            checked={enableSmartAtmosphere}
            onChange={onToggleEnableSmartAtmosphere}
            theme={theme}
            testId="interactive3d-toggle-smart-atmosphere"
        />

        <div className="space-y-2.5">
            <SectionLabel theme={theme}>
                {t('options.mineradioVisualPreset') || '视觉风格'}
            </SectionLabel>
            <div className="flex flex-wrap gap-2" data-testid="interactive3d-mineradio-presets">
                {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                    const isActive = tuning.visualPreset === preset;
                    return (
                        <button
                            key={preset}
                            type="button"
                            data-testid={`interactive3d-preset-${preset}`}
                            onClick={() => onTuningChange?.(applyMineradioVisualPreset(preset, tuning))}
                            className="px-3 py-2 rounded-full text-sm transition-all border"
                            style={{
                                borderColor: isActive
                                    ? colorWithAlpha(theme.secondaryColor, 0.45)
                                    : colorWithAlpha(theme.secondaryColor, 0.16),
                                backgroundColor: isActive
                                    ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                    : colorWithAlpha(theme.backgroundColor, 0.18),
                                color: theme.primaryColor,
                            }}
                        >
                            {t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset)}
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="space-y-2.5">
            <SectionLabel theme={theme}>
                {t('options.interactive3dQualityTier') || '渲染质量'}
            </SectionLabel>
            <div className="flex flex-wrap gap-2" data-testid="interactive3d-quality-tier-group">
                {INTERACTIVE3D_QUALITY_TIER_OPTIONS.map(tier => {
                    const isActive = tuning.qualityTier === tier;
                    return (
                        <button
                            key={tier}
                            type="button"
                            data-testid={`interactive3d-quality-${tier}`}
                            onClick={() => onTuningChange?.({ qualityTier: tier })}
                            className="px-3 py-2 rounded-full text-sm transition-all border"
                            style={{
                                borderColor: isActive
                                    ? colorWithAlpha(theme.secondaryColor, 0.45)
                                    : colorWithAlpha(theme.secondaryColor, 0.16),
                                backgroundColor: isActive
                                    ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                    : colorWithAlpha(theme.backgroundColor, 0.18),
                                color: theme.primaryColor,
                            }}
                        >
                            {getQualityTierLabel(tier, t)}
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="space-y-2.5">
            <SectionLabel theme={theme}>
                {t('options.interactive3dCameraControl') || '镜头交互'}
            </SectionLabel>
            <div className="text-xs opacity-70 max-w-[360px]" style={{ color: theme.secondaryColor }}>
                {t('options.interactive3dCameraControlDesc') || '控制 3D 背景的拖拽轨道、WASD 自由镜头或手势式粒子旋转。'}
            </div>
            <div className="flex flex-wrap gap-2" data-testid="interactive3d-camera-control-group">
                {INTERACTIVE3D_CAMERA_CONTROL_OPTIONS.map(mode => {
                    const isActive = tuning.cameraControl === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            data-testid={`interactive3d-camera-control-${mode}`}
                            onClick={() => onTuningChange?.({ cameraControl: mode })}
                            className="px-3 py-2 rounded-full text-sm transition-all border"
                            style={{
                                borderColor: isActive
                                    ? colorWithAlpha(theme.secondaryColor, 0.45)
                                    : colorWithAlpha(theme.secondaryColor, 0.16),
                                backgroundColor: isActive
                                    ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                    : colorWithAlpha(theme.backgroundColor, 0.18),
                                color: theme.primaryColor,
                            }}
                        >
                            {getCameraControlLabel(mode, t)}
                        </button>
                    );
                })}
            </div>
        </div>

        {!webglOnlyPath && (
            <Interactive3dShelfSettingsSection
                t={t}
                theme={theme}
                isDaylight={isDaylight}
                tuning={tuning}
                onTuningChange={onTuningChange}
            />
        )}

        {visibleSceneEffects.length > 0 && (
            <div className="space-y-3">
                <SectionLabel theme={theme}>
                    {t('options.interactive3dSceneLayers') || '场景组件'}
                </SectionLabel>
                <div className="space-y-3" data-testid="interactive3d-scene-layers">
                    {visibleSceneEffects.map(effect => (
                        <ToggleRow
                            key={effect.id}
                            label={t(effect.labelKey) || effect.labelFallback}
                            description={t(effect.descriptionKey) || effect.descriptionFallback}
                            checked={Boolean(tuning[effect.tuningKey])}
                            onChange={(enabled) => onTuningChange?.({ [effect.tuningKey]: enabled })}
                            theme={theme}
                            testId={effect.testId}
                        />
                    ))}
                </div>
            </div>
        )}

        {webglOnlyPath && effectiveSettings.conflicts.length > 0 && (
            <div
                className="rounded-2xl border px-3 py-2.5 space-y-1.5 text-xs"
                data-testid="interactive3d-settings-notices"
                style={{
                    borderColor: colorWithAlpha(theme.secondaryColor, 0.14),
                    color: theme.secondaryColor,
                }}
            >
                {effectiveSettings.conflicts.map(conflict => (
                    <p key={conflict.id} className="opacity-75 leading-snug">
                        {t(`options.interactive3dConflict.${conflict.id}`) || conflict.messageFallback}
                    </p>
                ))}
            </div>
        )}

        <ToggleRow
            label={t('options.disableVisualizerVignette') || '禁用暗角'}
            description={t('options.disableVisualizerVignetteDesc') || '关闭 3D 背景自带的边缘暗角。'}
            checked={disableVisualizerVignette}
            onChange={onToggleDisableVisualizerVignette}
            theme={theme}
            testId="interactive3d-toggle-vignette"
        />
    </div>
    );
};

export default Interactive3dBackgroundSettingsCard;
