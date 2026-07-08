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
}) => {
    const smartChipClass = isDaylight
        ? 'border-black/10 bg-white/45 text-stone-600'
        : 'border-white/10 bg-white/[0.05] text-white/60';
    const activeSmartChipClass = isDaylight
        ? 'border-stone-400/30 bg-white/75 text-stone-800'
        : 'border-white/20 bg-white/10 text-white/82';

    return (
        <div className={`${optionStyles.wellBg} rounded-xl p-2 space-y-2.5`} data-testid="controls-interactive3d-scene-panel">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                    <span className={`block text-[10px] font-medium ${isDaylight ? 'text-stone-700' : 'text-white/75'}`}>
                        {t('options.enableSmartAtmosphere') || '智能氛围'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {[
                            'Beat',
                            'Bass',
                            'Cam',
                        ].map((label) => (
                            <span
                                key={label}
                                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] leading-none ${enableSmartAtmosphere ? activeSmartChipClass : smartChipClass}`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    data-testid="controls-interactive3d-toggle-smart-atmosphere"
                    aria-pressed={enableSmartAtmosphere}
                    onClick={() => onToggleEnableSmartAtmosphere(!enableSmartAtmosphere)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${enableSmartAtmosphere ? (isDaylight ? 'bg-stone-400' : 'bg-white/30') : (isDaylight ? 'bg-stone-300/70' : 'bg-white/10')}`}
                >
                    <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enableSmartAtmosphere ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            <div className="space-y-1.5" data-testid="controls-interactive3d-mineradio-presets">
                <span className={`text-[10px] font-medium ${optionStyles.sectionHintClass}`}>
                    {t('options.mineradioVisualPreset') || '视觉风格'}
                </span>
                <div className={`grid grid-cols-3 gap-1 ${optionStyles.wellBg} p-1 rounded-xl`}>
                    {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                        const isActive = interactive3dSceneTuning.visualPreset === preset;

                        return (
                            <button
                                key={preset}
                                type="button"
                                data-testid={`controls-interactive3d-preset-${preset}`}
                                onClick={() => onInteractive3dSceneTuningChange(applyMineradioVisualPreset(preset, interactive3dSceneTuning))}
                                className={`py-1.5 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                            >
                                {getMineradioPresetLabel(preset, t)}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ControlsTabInteractive3dScenePanel;
