import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme, VisualizerBackgroundMode, VisualizerMode, Interactive3dSceneTuning } from '../../types';
import { getVisualizerModeLabel, VISUALIZER_REGISTRY } from '../visualizer/registry';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';
import { LYRICS_FONT_SCALE_QUICK_OPTIONS } from '../../utils/lyrics/lyricsFontScaleMath';
import { getControlsTabOptionButtonClass, type ControlsTabOptionStyles } from './controlsTabOptionStyles';
import { useVisualizerModeStepper } from '../../hooks/useVisualizerModeStepper';
import ModeStepperRow from './controls/ModeStepperRow';
import { VisualizerModeGlyph } from './controls/modeGlyphs';
import ControlsTabBackgroundStepper from './ControlsTabBackgroundStepper';
import LyricColorPresetGrid from '../shared/LyricColorPresetGrid';
import LyricFontPresetSelector from '../shared/LyricFontPresetSelector';

// src/components/panelTab/ControlsTabCoreSection.tsx
// Controls tab: always-visible core lyric settings (layout / background / color / font / size).

type ControlsTabCoreSectionProps = {
    theme: Theme;
    visualizerMode: VisualizerMode;
    onVisualizerModeChange: (mode: VisualizerMode) => void;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    isDaylight: boolean;
    optionStyles: ControlsTabOptionStyles;
};

const labelClass = 'text-[10px] font-bold uppercase tracking-widest opacity-40';

const nearScale = (left: number, right: number) => Math.abs(left - right) < 0.02;

const ControlsTabCoreSection: React.FC<ControlsTabCoreSectionProps> = ({
    theme,
    visualizerMode,
    onVisualizerModeChange,
    visualizerBackgroundMode = null,
    interactive3dSceneTuning: _interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange: _onInteractive3dSceneTuningChange,
    onApplyLyricColorPreset,
    isDaylight,
    optionStyles,
}) => {
    const { t } = useTranslation();
    const lyricFontPresetId = useSettingsUiStore(state => state.lyricFontPresetId);
    const lyricsFontScale = useSettingsUiStore(state => state.lyricsFontScale);
    const handleSetLyricFontPresetId = useSettingsUiStore(state => state.handleSetLyricFontPresetId);
    const handleSetLyricsCustomFont = useSettingsUiStore(state => state.handleSetLyricsCustomFont);
    const handleSetLyricsFontScale = useSettingsUiStore(state => state.handleSetLyricsFontScale);
    const { wellBg } = optionStyles;
    const openSettings = useSettingsUiStore(state => state.openSettings);

    const visualizerOptions = VISUALIZER_REGISTRY.map(entry => ({
        value: entry.mode,
        label: getVisualizerModeLabel(entry.mode, t),
    }));
    const stepVisualizerMode = useVisualizerModeStepper(visualizerOptions.map(option => option.value));

    return (
        <div className="space-y-2.5" data-testid="controls-core-section">
            <div className="space-y-1" data-testid="controls-lyrics-animation-section">
                <span className={labelClass}>{t('ui.lyricLayout') || 'Layout'}</span>
                <ModeStepperRow
                    value={visualizerMode}
                    options={visualizerOptions}
                    onSelect={onVisualizerModeChange}
                    onStep={stepVisualizerMode}
                    renderGlyph={mode => <VisualizerModeGlyph mode={mode} />}
                    ariaLabel={t('ui.lyricLayout') || 'Layout'}
                    moreLabel={t('ui.moreSettings') || 'More settings'}
                    onOpenMore={() => openSettings('options', 'visualizer')}
                    isDaylight={isDaylight}
                    primaryColor={theme.primaryColor}
                    testIdPrefix="controls-visualizer-mode"
                />
            </div>

            <ControlsTabBackgroundStepper
                theme={theme}
                visualizerMode={visualizerMode}
                visualizerBackgroundMode={visualizerBackgroundMode}
                onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                isDaylight={isDaylight}
            />

            {onApplyLyricColorPreset ? (
                <div className="space-y-1" data-testid="controls-lyric-color-section">
                    <span className={labelClass}>{t('options.lyricColorPresetTitle') || 'Lyric colors'}</span>
                    <div
                        className={`${wellBg} flex items-center gap-2 rounded-lg px-2 py-1.5`}
                        data-testid="controls-lyric-color-presets"
                    >
                        <LyricColorPresetGrid
                            dotsOnly
                            onSelect={onApplyLyricColorPreset}
                            activePresetId={resolveActiveLyricColorPresetId(
                                theme,
                                isDaylight ? 'light' : 'dark',
                            )}
                            isDaylight={isDaylight}
                            className="min-w-0 flex-1"
                        />
                    </div>
                </div>
            ) : null}

            <div className="space-y-1" data-testid="controls-lyric-font-section">
                <span className={labelClass}>{t('ui.lyricFont') || 'Font'}</span>
                <div className={`${wellBg} p-0.5 rounded-lg`}>
                    <LyricFontPresetSelector
                        selectedPresetId={lyricFontPresetId}
                        onPresetChange={(presetId) => {
                            handleSetLyricsCustomFont(null);
                            handleSetLyricFontPresetId(presetId);
                        }}
                        isDaylight={isDaylight}
                    />
                </div>
            </div>

            <div className="space-y-1" data-testid="controls-lyric-font-size-section">
                <div className="flex items-center justify-between gap-2">
                    <span className={labelClass}>{t('options.fontSize') || '字号'}</span>
                    <span className="text-[10px] font-bold tabular-nums opacity-55">
                        {Math.round(lyricsFontScale * 100)}%
                    </span>
                </div>
                <div className={`grid grid-cols-4 gap-0.5 ${wellBg} p-0.5 rounded-lg`}>
                    {LYRICS_FONT_SCALE_QUICK_OPTIONS.map(option => {
                        const isActive = nearScale(lyricsFontScale, option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                data-testid={`controls-lyric-font-scale-${option.value}`}
                                onClick={() => handleSetLyricsFontScale(option.value)}
                                className={`py-1 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                <div className={`${wellBg} rounded-lg px-2 py-1.5`}>
                    <input
                        type="range"
                        min={0.85}
                        max={1.4}
                        step={0.05}
                        value={lyricsFontScale}
                        onChange={(event) => handleSetLyricsFontScale(parseFloat(event.currentTarget.value))}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                        style={{ accentColor: theme.primaryColor }}
                        aria-label={t('options.fontSize') || '字号'}
                        data-testid="controls-lyric-font-scale-slider"
                    />
                </div>
            </div>
        </div>
    );
};

export default ControlsTabCoreSection;
