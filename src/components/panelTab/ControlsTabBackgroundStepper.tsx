import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme, VisualizerBackgroundMode, VisualizerMode } from '../../types';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { stepOrderedValue } from '../../utils/visualizer/stepOrderedValue';
import {
    getPanelBackgroundModeLabel,
    isPanelPlayerBackgroundMode,
    PANEL_PLAYER_BACKGROUND_MODES,
} from '../../utils/visualizer/panelBackgroundModes';
import ModeStepperRow from './controls/ModeStepperRow';
import { BackgroundModeGlyph } from './controls/modeGlyphs';

// src/components/panelTab/ControlsTabBackgroundStepper.tsx
// Core-panel background engine stepper.

type ControlsTabBackgroundStepperProps = {
    theme: Theme;
    visualizerMode: VisualizerMode;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    isDaylight: boolean;
};

const ControlsTabBackgroundStepper: React.FC<ControlsTabBackgroundStepperProps> = ({
    theme,
    visualizerMode,
    visualizerBackgroundMode = null,
    onVisualizerBackgroundModeChange,
    isDaylight,
}) => {
    const { t } = useTranslation();
    const openSettings = useSettingsUiStore(state => state.openSettings);
    const setVisualizerBackgroundMode = useSettingsUiStore(state => state.handleSetVisualizerBackgroundMode);
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode, visualizerMode);
    const applyMode = onVisualizerBackgroundModeChange ?? setVisualizerBackgroundMode;
    const stepModes = isPanelPlayerBackgroundMode(resolvedBackgroundMode)
        ? PANEL_PLAYER_BACKGROUND_MODES
        : [resolvedBackgroundMode, ...PANEL_PLAYER_BACKGROUND_MODES];
    const backgroundOptions = stepModes.map(mode => ({
        value: mode,
        label: getPanelBackgroundModeLabel(mode, t),
    }));

    return (
        <div className="space-y-1" data-testid="controls-background-stepper-section">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                {t('ui.background') || 'Background'}
            </span>
            <ModeStepperRow
                value={resolvedBackgroundMode}
                options={backgroundOptions}
                onSelect={applyMode}
                onStep={(direction) => {
                    applyMode(stepOrderedValue(stepModes, resolvedBackgroundMode, direction));
                }}
                renderGlyph={mode => <BackgroundModeGlyph mode={mode} />}
                ariaLabel={t('options.visualizerBackgroundMode') || 'Background mode'}
                moreLabel={t('ui.moreSettings') || 'More settings'}
                onOpenMore={() => openSettings('options', 'visualizer')}
                isDaylight={isDaylight}
                primaryColor={theme.primaryColor}
                testIdPrefix="controls-background-mode"
            />
        </div>
    );
};

export default ControlsTabBackgroundStepper;
