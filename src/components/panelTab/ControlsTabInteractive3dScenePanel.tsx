import React from 'react';
import {
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
} from '../../types';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../visualizer/geometric/mineradioVisualPresets';
import type { ControlsTabOptionStyles } from './controlsTabOptionStyles';
import { getControlsTabOptionButtonClass } from './controlsTabOptionStyles';

// src/components/panelTab/ControlsTabInteractive3dScenePanel.tsx
// Compact interactive 3D controls for the player panel background section.

interface ControlsTabInteractive3dScenePanelProps {
    t: (key: string) => string;
    interactive3dSceneTuning: Interactive3dSceneTuning;
    enableSmartAtmosphere: boolean;
    isDaylight: boolean;
    optionStyles: ControlsTabOptionStyles;
    onInteractive3dSceneTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
    onToggleEnableSmartAtmosphere: (enabled: boolean) => void;
}

const getMineradioPresetLabel = (
    preset: MineradioVisualPresetId,
    t: (key: string) => string,
) => t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset);

export const ControlsTabInteractive3dScenePanel: React.FC<ControlsTabInteractive3dScenePanelProps> = ({
    t,
    interactive3dSceneTuning,
    enableSmartAtmosphere,
    isDaylight,
    optionStyles,
    onInteractive3dSceneTuningChange,
    onToggleEnableSmartAtmosphere,
}) => (
    <div className="space-y-1.5" data-testid="controls-interactive3d-scene-panel">
        <div className="space-y-1" data-testid="controls-interactive3d-mineradio-presets">
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-medium ${optionStyles.sectionHintClass}`}>
                    {t('options.mineradioVisualPreset') || '3D 风格'}
                </span>
                <button
                    type="button"
                    data-testid="controls-interactive3d-toggle-smart-atmosphere"
                    aria-pressed={enableSmartAtmosphere}
                    onClick={() => onToggleEnableSmartAtmosphere(!enableSmartAtmosphere)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        enableSmartAtmosphere
                            ? (isDaylight ? 'bg-stone-900 text-white' : 'bg-white text-zinc-950')
                            : (isDaylight ? 'bg-black/5 text-stone-600' : 'bg-white/10 text-white/78')
                    }`}
                    title={t('options.enableSmartAtmosphere') || '智能氛围'}
                >
                    {t('options.enableSmartAtmosphere') || '智能氛围'}
                </button>
            </div>
            <div className={`grid grid-cols-3 gap-0.5 ${optionStyles.wellBg} p-0.5 rounded-xl`}>
                {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                    const isActive = interactive3dSceneTuning.visualPreset === preset;

                    return (
                        <button
                            key={preset}
                            type="button"
                            data-testid={`controls-interactive3d-preset-${preset}`}
                            onClick={() => {
                                onInteractive3dSceneTuningChange(
                                    applyMineradioVisualPreset(preset, interactive3dSceneTuning),
                                );
                            }}
                            className={`py-1 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                        >
                            {getMineradioPresetLabel(preset, t)}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

export default ControlsTabInteractive3dScenePanel;
