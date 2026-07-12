import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type Interactive3dSceneTuning,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../../types';
import { resolveVisualizerBackgroundMode } from '../../stores/useSettingsUiStore';
import ControlsTabInteractive3dScenePanel from './ControlsTabInteractive3dScenePanel';
import { getControlsTabOptionButtonClass, getControlsTabOptionStyles } from './controlsTabOptionStyles';

// src/components/panelTab/ControlsTabPlayerBackgroundSection.tsx
// Compact player-panel controls for visualizer background mode and 3D presets.

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
        <div className="space-y-1.5 pt-1" data-testid="controls-player-background-section">
            <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {t('ui.playerPageBackground') || '播放页背景'}
                </label>
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

            <div className={`grid grid-cols-3 gap-0.5 ${wellBg} p-0.5 rounded-xl`} data-testid="controls-player-background-mode-group">
                {PLAYER_BACKGROUND_MODES.map(mode => (
                    <button
                        key={mode}
                        type="button"
                        data-testid={`controls-player-background-mode-${mode}`}
                        onClick={() => onVisualizerBackgroundModeChange(mode)}
                        className={`py-1 ${getControlsTabOptionButtonClass(
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
                <ControlsTabInteractive3dScenePanel
                    t={t}
                    interactive3dSceneTuning={interactive3dSceneTuning}
                    enableSmartAtmosphere={enableSmartAtmosphere}
                    isDaylight={isDaylight}
                    optionStyles={optionStyles}
                    onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange}
                    onToggleEnableSmartAtmosphere={onToggleEnableSmartAtmosphere}
                />
            )}
        </div>
    );
};

export default ControlsTabPlayerBackgroundSection;
