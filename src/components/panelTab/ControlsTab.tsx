import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Repeat1, RepeatOff, Heart, Sparkles, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme, ThemeMode, VisualizerMode, type Interactive3dSceneTuning, type VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import { getVisualizerModeLabel, VISUALIZER_REGISTRY } from '../visualizer/registry';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../visualizer/geometric/mineradioVisualPresets';
import { getControlsTabOptionButtonClass, getControlsTabOptionStyles } from './controlsTabOptionStyles';
import LyricColorPicker from '../shared/LyricColorPicker';
import LyricColorPresetGrid from '../shared/LyricColorPresetGrid';
import LyricFontPresetSelector from '../shared/LyricFontPresetSelector';
import LyricVisualEffectSelector from '../shared/LyricVisualEffectSelector';
import LyricWordModeToggle from '../shared/LyricWordModeToggle';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';

// Controls tab: high-frequency player shortcuts only. Theme/background/intensity live in Settings.

interface ControlsTabProps {
    loopMode: 'off' | 'all' | 'one';
    onToggleLoop: () => void;
    onLike: () => void;
    isLiked: boolean;
    onGenerateAITheme: () => void;
    onActivateSmartTheme: () => void;
    isGeneratingTheme: boolean;
    canGenerateAITheme: boolean;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    bgMode: ThemeMode;
    onBgModeChange: (mode: ThemeMode) => void;
    hasCustomTheme: boolean;
    themeSourceModel: ThemeSourceModel;
    onResetTheme: () => void;
    defaultTheme: Theme;
    daylightTheme: Theme;
    visualizerMode: VisualizerMode;
    onVisualizerModeChange: (mode: VisualizerMode) => void;
    useCoverColorBg: boolean;
    onToggleCoverColorBg: (enable: boolean) => void;
    isDaylight: boolean;
    onToggleDaylight: () => void;
    volume: number;
    isMuted: boolean;
    onVolumePreview: (val: number) => void;
    onVolumeChange: (val: number) => void;
    onToggleMute: () => void;
    loopToggleDisabled?: boolean;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    enableSmartAtmosphere?: boolean;
    disableVisualizerVignette?: boolean;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    onToggleEnableSmartAtmosphere?: (enabled: boolean) => void;
    onToggleDisableVisualizerVignette?: (disabled: boolean) => void;
    onOpenAdvancedBackgroundSettings?: () => void;
    onApplyLyricBodyColor?: (color: string) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
}

const ControlsTab: React.FC<ControlsTabProps> = ({
    loopMode,
    onToggleLoop,
    onLike,
    isLiked,
    onGenerateAITheme,
    isGeneratingTheme,
    canGenerateAITheme,
    theme,
    visualizerMode,
    onVisualizerModeChange,
    isDaylight,
    volume,
    isMuted,
    onVolumePreview,
    onVolumeChange,
    onToggleMute,
    loopToggleDisabled = false,
    interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    onOpenAdvancedBackgroundSettings,
    onApplyLyricBodyColor,
    onApplyLyricColorPreset,
}) => {
    const { t } = useTranslation();
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricFontPresetId = useSettingsUiStore(state => state.lyricFontPresetId);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const handleSetLyricsCustomFont = useSettingsUiStore(state => state.handleSetLyricsCustomFont);
    const handleSetLyricWordMode = useSettingsUiStore(state => state.handleSetLyricWordMode);
    const handleSetLyricFontPresetId = useSettingsUiStore(state => state.handleSetLyricFontPresetId);
    const handleSetVisualEffectIntensity = useSettingsUiStore(state => state.handleSetVisualEffectIntensity);
    const [sliderVolume, setSliderVolume] = useState(isMuted ? 0 : volume);
    const isDraggingRef = useRef(false);
    const pendingVolumeRef = useRef(sliderVolume);
    const optionStyles = getControlsTabOptionStyles(isDaylight);
    const { wellBg, sectionHintClass } = optionStyles;

    useEffect(() => {
        if (!isDraggingRef.current) {
            const nextVolume = isMuted ? 0 : volume;
            setSliderVolume(nextVolume);
            pendingVolumeRef.current = nextVolume;
        }
    }, [volume, isMuted]);

    const loopButtonBg = isDaylight ? 'bg-black/5 hover:bg-zinc-300/85' : 'bg-white/5 hover:bg-white/10';
    const buttonBg = isDaylight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10';

    const handleSliderInput = (nextVolume: number) => {
        isDraggingRef.current = true;
        pendingVolumeRef.current = nextVolume;
        setSliderVolume(nextVolume);
        onVolumePreview(nextVolume);
    };

    const commitVolumeChange = () => {
        if (!isDraggingRef.current) {
            return;
        }
        isDraggingRef.current = false;
        onVolumeChange(pendingVolumeRef.current);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
            data-testid="controls-tab"
        >
            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1" data-testid="controls-quick-actions">
                    <button
                        type="button"
                        onClick={onToggleLoop}
                        disabled={loopToggleDisabled}
                        className={`h-7 rounded-lg flex items-center justify-center transition-colors ${loopButtonBg} ${loopToggleDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                    >
                        {loopMode === 'off' ? <RepeatOff size={15} /> : loopMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
                    </button>

                    <button
                        type="button"
                        onClick={onLike}
                        className={`h-7 rounded-lg flex items-center justify-center transition-colors ${isLiked ? 'bg-red-500/20 text-red-500' : buttonBg}`}
                    >
                        <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>

                    <button
                        type="button"
                        onClick={onGenerateAITheme}
                        disabled={isGeneratingTheme || !canGenerateAITheme}
                        className={`h-7 rounded-lg flex items-center justify-center transition-colors ${isGeneratingTheme ? 'bg-blue-500/20 text-blue-300' : buttonBg}`}
                    >
                        <Sparkles size={15} className={isGeneratingTheme ? 'animate-pulse' : ''} />
                    </button>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-1.5">
                    <div className={`flex items-center gap-2 ${wellBg} rounded-lg px-1.5 py-1`}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMute();
                            }}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                            aria-label={t('ui.volume') || 'Volume'}
                        >
                            {isMuted || sliderVolume === 0 ? <VolumeX size={14} /> : sliderVolume < 0.5 ? <Volume1 size={14} /> : <Volume2 size={14} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={sliderVolume}
                            onInput={(e) => handleSliderInput(parseFloat(e.currentTarget.value))}
                            onChange={(e) => handleSliderInput(parseFloat(e.currentTarget.value))}
                            onMouseUp={commitVolumeChange}
                            onTouchEnd={commitVolumeChange}
                            onKeyUp={commitVolumeChange}
                            onBlur={commitVolumeChange}
                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-(--text-primary)"
                            style={{ accentColor: theme.primaryColor }}
                            aria-label={t('ui.volume') || 'Volume'}
                        />
                        <span className="w-8 text-right text-[10px] font-bold opacity-55 tabular-nums">
                            {Math.round(sliderVolume * 100)}%
                        </span>
                    </div>

                    <div className="space-y-1" data-testid="controls-lyrics-animation-section">
                        <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            {t('ui.lyricsAnimationStyle') || t('ui.visualizer') || '歌词样式'}
                        </label>
                        <div className={`grid grid-cols-4 gap-0.5 ${wellBg} p-0.5 rounded-lg`} data-testid="controls-visualizer-mode-group">
                            {VISUALIZER_REGISTRY.map((entry) => {
                                const isActive = entry.mode === visualizerMode;
                                return (
                                    <button
                                        key={entry.mode}
                                        type="button"
                                        data-testid={`controls-visualizer-mode-${entry.mode}`}
                                        onClick={() => onVisualizerModeChange(entry.mode)}
                                        className={`px-0.5 py-1 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                                    >
                                        {getVisualizerModeLabel(entry.mode, t)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <LyricWordModeToggle
                        value={lyricWordMode}
                        onChange={handleSetLyricWordMode}
                        sectionLabel={t('ui.lyricWordMode') || '逐字'}
                        defaultLabel={t('ui.lyricWordModeDefault') || '默认'}
                        karaokeLabel={t('ui.lyricWordModeKaraoke') || t('ui.visualizerKaraoke') || 'K歌'}
                        wellClassName={wellBg}
                        buttonClassName={selected => getControlsTabOptionButtonClass(selected, optionStyles)}
                        testIdPrefix="controls-lyric-word-mode"
                    />

                    {(onApplyLyricBodyColor || onApplyLyricColorPreset) && (
                        <div className="space-y-1" data-testid="controls-lyric-color-section">
                            <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {t('options.lyricColorPresetTitle') || '歌词颜色'}
                            </label>
                            {onApplyLyricColorPreset ? (
                                <div className={`${wellBg} p-0.5 rounded-lg`} data-testid="controls-lyric-color-presets">
                                    <LyricColorPresetGrid
                                        compact
                                        onSelect={onApplyLyricColorPreset}
                                        activePresetId={resolveActiveLyricColorPresetId(
                                            theme,
                                            isDaylight ? 'light' : 'dark',
                                        )}
                                        isDaylight={isDaylight}
                                        className="!grid-cols-3 gap-0.5"
                                        inactiveButtonClassName={isDaylight
                                            ? 'text-stone-800 hover:bg-black/[0.05]'
                                            : 'text-white/88 hover:bg-white/[0.08]'}
                                        activeButtonClassName={optionStyles.activeOptionClass}
                                        buttonClassName="w-full"
                                    />
                                </div>
                            ) : null}
                            {onApplyLyricBodyColor ? (
                                <div className={`${wellBg} p-1.5 rounded-lg ${onApplyLyricColorPreset ? 'mt-1' : ''}`}>
                                    <LyricColorPicker
                                        compact
                                        color={theme.primaryColor}
                                        onChange={onApplyLyricBodyColor}
                                        isDaylight={isDaylight}
                                    />
                                </div>
                            ) : null}
                            <div className={`mt-2 space-y-1 border-t pt-2 ${
                                isDaylight ? 'border-black/10' : 'border-white/10'
                            }`}>
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                    {t('options.lyricFontPreset') || '歌词字体'}
                                </label>
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
                            <div className={`mt-2 space-y-1 border-t pt-2 ${
                                isDaylight ? 'border-black/10' : 'border-white/10'
                            }`}>
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                    {t('options.visualEffectIntensity') || '效果强度'}
                                </label>
                                <div className={`${wellBg} p-0.5 rounded-lg`}>
                                    <LyricVisualEffectSelector
                                        selectedIntensity={visualEffectIntensity}
                                        onIntensityChange={handleSetVisualEffectIntensity}
                                        isDaylight={isDaylight}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {interactive3dSceneTuning && onInteractive3dSceneTuningChange && (
                        <div className="space-y-1" data-testid="controls-interactive3d-presets-section">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                    {t('options.mineradioVisualPreset') || '3D 风格'}
                                </label>
                                {onOpenAdvancedBackgroundSettings && (
                                    <button
                                        type="button"
                                        data-testid="controls-open-more-settings"
                                        onClick={onOpenAdvancedBackgroundSettings}
                                        className={`text-[10px] transition-opacity hover:opacity-80 ${sectionHintClass}`}
                                    >
                                        {t('ui.moreBackgroundSettings') || '更多…'}
                                    </button>
                                )}
                            </div>
                            <div className={`grid grid-cols-3 gap-0.5 ${wellBg} p-0.5 rounded-lg`}>
                                {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                                    const isActive = interactive3dSceneTuning.visualPreset === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            data-testid={`controls-interactive3d-preset-${preset}`}
                                            onClick={() => {
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
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ControlsTab;
