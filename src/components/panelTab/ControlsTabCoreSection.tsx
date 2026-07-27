import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme, VisualizerBackgroundMode, VisualizerMode, Interactive3dSceneTuning } from '../../types';
import { getVisualizerModeLabel, VISUALIZER_REGISTRY } from '../visualizer/registry';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
    normalizeInteractive3dVisualPreset,
} from '../visualizer/geometric/mineradioVisualPresets';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';
import { LYRICS_FONT_SCALE_QUICK_OPTIONS } from '../../utils/lyrics/lyricsFontScaleMath';
import { getControlsTabOptionButtonClass, type ControlsTabOptionStyles } from './controlsTabOptionStyles';
import QuickEffectPicker from './QuickEffectPicker';
import LyricColorPresetGrid from '../shared/LyricColorPresetGrid';
import LyricFontPresetSelector from '../shared/LyricFontPresetSelector';
import GpuBackgroundFallbackNote, {
    shouldShowGpuBackgroundFallbackNote,
} from '../shared/GpuBackgroundFallbackNote';

// src/components/panelTab/ControlsTabCoreSection.tsx
// Controls tab: always-visible core lyric settings (layout / 3D background / color / font / size).

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
    interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
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
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode, visualizerMode);

    const visualizerOptions = VISUALIZER_REGISTRY.map(entry => ({
        value: entry.mode,
        label: getVisualizerModeLabel(entry.mode, t),
    }));

    return (
        <div className="space-y-2.5" data-testid="controls-core-section">
            <div
                className="flex items-center justify-between gap-2"
                data-testid="controls-lyrics-animation-section"
            >
                <span className={labelClass}>{t('ui.lyricLayout') || 'Layout'}</span>
                <QuickEffectPicker
                    value={visualizerMode}
                    options={visualizerOptions}
                    onChange={onVisualizerModeChange}
                    isDaylight={isDaylight}
                    primaryColor={theme.primaryColor}
                    ariaLabel={t('ui.lyricLayout') || 'Layout'}
                    testIdPrefix="controls-visualizer-mode"
                />
            </div>

            {interactive3dSceneTuning && onInteractive3dSceneTuningChange ? (
                <div className="space-y-1" data-testid="controls-interactive3d-presets-section">
                    <span className={labelClass}>{t('ui.background3d') || '3D Background'}</span>
                    <GpuBackgroundFallbackNote
                        visible={shouldShowGpuBackgroundFallbackNote({
                            resolvedMode: resolvedBackgroundMode,
                        })}
                        variant="controls"
                        testId="controls-background-gpu-fallback-note"
                    />
                    <div className={`grid grid-cols-4 gap-0.5 ${wellBg} p-0.5 rounded-lg`}>
                        {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                            // Highlight only when the live background engine is interactive3d.
                            const isActive = resolvedBackgroundMode === 'interactive3d'
                                && normalizeInteractive3dVisualPreset(
                                    interactive3dSceneTuning.visualPreset,
                                ) === preset;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    role="radio"
                                    aria-checked={isActive}
                                    data-testid={`controls-interactive3d-preset-${preset}`}
                                    onClick={() => {
                                        // Always force interactive3d so UI selection matches the live stage.
                                        onVisualizerBackgroundModeChange?.('interactive3d');
                                        onInteractive3dSceneTuningChange(
                                            applyMineradioVisualPreset(preset, interactive3dSceneTuning),
                                        );
                                    }}
                                    className={`py-1 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                                >
                                    {t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

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
