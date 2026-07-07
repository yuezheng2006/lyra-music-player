import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../../types';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../visualizer/geometric/mineradioVisualPresets';
import { resolveVisualizerBackgroundMode } from '../../stores/useSettingsUiStore';
import { getControlsTabOptionButtonClass, getControlsTabOptionStyles } from './controlsTabOptionStyles';

// src/components/panelTab/ControlsTabPlayerBackgroundSection.tsx
// Compact player-panel controls for visualizer background mode and 3D presets.

const getMineradioPresetLabel = (
    preset: MineradioVisualPresetId,
    t: (key: string) => string,
) => t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset);

const PLAYER_BACKGROUND_MODES: VisualizerBackgroundMode[] = ['interactive3d', 'common', 'monet'];

type ControlsTabPlayerBackgroundSectionProps = {
    visualizerMode: VisualizerMode;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    enableSmartAtmosphere: boolean;
    isDaylight: boolean;
    onVisualizerBackgroundModeChange: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
    onToggleEnableSmartAtmosphere: (enabled: boolean) => void;
    onOpenAdvancedBackgroundSettings?: () => void;
};

const getBackgroundModeLabel = (
    mode: VisualizerBackgroundMode,
    t: (key: string) => string,
) => {
    switch (mode) {
        case 'interactive3d':
            return t('options.visualizerBackgroundModeInteractive3d') || '3D 交互';
        case 'common':
            return t('options.visualizerBackgroundModeCommon') || '通用';
        case 'monet':
            return t('options.visualizerBackgroundModeMonet') || '莫奈';
        case 'url':
            return t('options.visualizerBackgroundModeUrl') || '嵌入';
        case 'sora':
            return t('options.visualizerBackgroundModeSora') || '空';
        default:
            return mode;
    }
};

const ControlsTabPlayerBackgroundSection: React.FC<ControlsTabPlayerBackgroundSectionProps> = ({
    visualizerMode,
    visualizerBackgroundMode,
    interactive3dSceneTuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    enableSmartAtmosphere,
    isDaylight,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    onToggleEnableSmartAtmosphere,
    onOpenAdvancedBackgroundSettings,
}) => {
    const { t } = useTranslation();
    const optionStyles = getControlsTabOptionStyles(isDaylight);
    const { wellBg, sectionHintClass } = optionStyles;
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode, visualizerMode);
    const isInteractive3d = resolvedBackgroundMode === 'interactive3d';
    const isAdvancedBackgroundMode = visualizerBackgroundMode != null
        && !PLAYER_BACKGROUND_MODES.includes(visualizerBackgroundMode);

    return (
        <div className="space-y-2 pt-2" data-testid="controls-player-background-section">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                        {t('ui.playerPageBackground') || '播放页背景'}
                    </label>
                    <p className={`mt-1 text-[9px] leading-snug ${sectionHintClass}`}>
                        {t('ui.playerPageBackgroundDesc') || '歌词下方的动态背景层'}
                    </p>
                </div>
                {onOpenAdvancedBackgroundSettings && (
                    <button
                        type="button"
                        onClick={onOpenAdvancedBackgroundSettings}
                        className={`text-[10px] transition-opacity hover:opacity-80 ${sectionHintClass}`}
                    >
                        {t('ui.moreBackgroundSettings') || '更多…'}
                    </button>
                )}
            </div>

            <div className={`grid grid-cols-3 gap-1 ${wellBg} p-1 rounded-xl`} data-testid="controls-player-background-mode-group">
                {PLAYER_BACKGROUND_MODES.map(mode => (
                    <button
                        key={mode}
                        type="button"
                        data-testid={`controls-player-background-mode-${mode}`}
                        onClick={() => onVisualizerBackgroundModeChange(mode)}
                        className={`py-1.5 ${getControlsTabOptionButtonClass(
                            resolvedBackgroundMode === mode && !isAdvancedBackgroundMode,
                            optionStyles,
                        )}`}
                    >
                        {getBackgroundModeLabel(mode, t)}
                    </button>
                ))}
            </div>

            {isAdvancedBackgroundMode && (
                <p className={`text-[10px] leading-snug ${sectionHintClass}`}>
                    {t('ui.advancedBackgroundModeActive') || '当前使用高级背景模式，可在「更多…」中调整。'}
                </p>
            )}

            {isInteractive3d && (
                <div className={`${wellBg} rounded-xl p-2 space-y-2`} data-testid="controls-interactive3d-scene-panel">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-medium ${isDaylight ? 'text-stone-700' : 'text-white/75'}`}>
                            {t('options.enableSmartAtmosphere') || '智能氛围'}
                        </span>
                        <button
                            type="button"
                            data-testid="controls-interactive3d-toggle-smart-atmosphere"
                            aria-pressed={enableSmartAtmosphere}
                            onClick={() => onToggleEnableSmartAtmosphere(!enableSmartAtmosphere)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${enableSmartAtmosphere ? (isDaylight ? 'bg-stone-400' : 'bg-white/30') : (isDaylight ? 'bg-stone-300/70' : 'bg-white/10')}`}
                        >
                            <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enableSmartAtmosphere ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="space-y-1" data-testid="controls-interactive3d-mineradio-presets">
                        <span className={`text-[10px] font-medium ${sectionHintClass}`}>
                            {t('options.mineradioVisualPreset') || '视觉风格'}
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                            {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    data-testid={`controls-interactive3d-preset-${preset}`}
                                    onClick={() => onInteractive3dSceneTuningChange(applyMineradioVisualPreset(preset, interactive3dSceneTuning))}
                                    className={`px-1.5 py-1 ${getControlsTabOptionButtonClass(
                                        interactive3dSceneTuning.visualPreset === preset,
                                        optionStyles,
                                    )}`}
                                >
                                    {getMineradioPresetLabel(preset, t)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlsTabPlayerBackgroundSection;
