import React from 'react';
import { RotateCcw } from 'lucide-react';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dSceneTuning,
    type Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import {
    isInteractive3dWebGLOnlyPath,
} from '../resolveInteractive3dEffectiveSettings';
import { Interactive3dCameraControlSelector } from './Interactive3dCameraControlSelector';
import { Interactive3dQualityTierSelector } from './Interactive3dQualityTierSelector';
import {
    Interactive3dToggleRow,
} from './Interactive3dSettingsPrimitives';
import { Interactive3dSmartAtmosphereControl } from './Interactive3dSmartAtmosphereControl';
import Interactive3dShelfSettingsSection from './Interactive3dShelfSettingsSection';
import { Interactive3dVisualPresetDeck } from './Interactive3dVisualPresetDeck';

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
    const webglOnlyPath = isInteractive3dWebGLOnlyPath(effectiveSettingsInput);

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

        <Interactive3dSmartAtmosphereControl
            label={t('options.enableSmartAtmosphere') || '智能氛围'}
            description={t('options.enableSmartAtmosphereDesc') || '让背景和歌词跟着音乐律动。'}
            checked={enableSmartAtmosphere}
            onChange={onToggleEnableSmartAtmosphere}
            theme={theme}
            t={t}
            tuning={tuning}
            onTuningChange={onTuningChange}
        />

        <Interactive3dVisualPresetDeck
            t={t}
            theme={theme}
            isDaylight={isDaylight}
            tuning={tuning}
            onTuningChange={onTuningChange}
        />

        <Interactive3dQualityTierSelector
            t={t}
            theme={theme}
            isDaylight={isDaylight}
            tuning={tuning}
            onTuningChange={onTuningChange}
        />

        <Interactive3dCameraControlSelector
            t={t}
            theme={theme}
            isDaylight={isDaylight}
            tuning={tuning}
            onTuningChange={onTuningChange}
        />

        {!webglOnlyPath && (
            <Interactive3dShelfSettingsSection
                t={t}
                theme={theme}
                isDaylight={isDaylight}
                tuning={tuning}
                onTuningChange={onTuningChange}
            />
        )}

        {!webglOnlyPath && (
            <Interactive3dToggleRow
                label={t('options.disableVisualizerVignette') || '禁用暗角'}
                description={t('options.disableVisualizerVignetteDesc') || '关闭 3D 背景自带的边缘暗角。'}
                checked={disableVisualizerVignette}
                onChange={onToggleDisableVisualizerVignette}
                theme={theme}
                testId="interactive3d-toggle-vignette"
            />
        )}
    </div>
    );
};

export default Interactive3dBackgroundSettingsCard;
