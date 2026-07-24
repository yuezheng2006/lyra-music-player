import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Repeat1, RepeatOff, Heart, Sparkles, Volume2, Volume1, VolumeX, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme, ThemeMode, VisualizerMode, type Interactive3dSceneTuning, type VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../visualizer/geometric/mineradioVisualPresets';
import { getControlsTabOptionButtonClass, getControlsTabOptionStyles } from './controlsTabOptionStyles';
import ControlsTabThemeSection from './ControlsTabThemeSection';
import LyricColorPicker from '../shared/LyricColorPicker';
import LyricColorPresetGrid from '../shared/LyricColorPresetGrid';
import LyricFontPresetSelector from '../shared/LyricFontPresetSelector';
import LyricVisualEffectSelector from '../shared/LyricVisualEffectSelector';
import LyricEffectPackSelector from '../shared/LyricEffectPackSelector';
import { getLyricEffectPackSuggestion } from '../../utils/lyricEffectPacks';
import LyricWordModeToggle from '../shared/LyricWordModeToggle';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';

// Controls tab: song settings — high-frequency shortcuts; advanced lyric editors stay collapsed.

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
    onThemeChange,
    onBgModeChange,
    hasCustomTheme,
    themeSourceModel,
    defaultTheme,
    daylightTheme,
    visualizerMode,
    onVisualizerModeChange,
    isDaylight,
    onToggleDaylight,
    volume,
    isMuted,
    onVolumePreview,
    onVolumeChange,
    onToggleMute,
    loopToggleDisabled = false,
    visualizerBackgroundMode,
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
    const lyricEffectPackId = useSettingsUiStore(state => state.lyricEffectPackId);
    const handleSetLyricsCustomFont = useSettingsUiStore(state => state.handleSetLyricsCustomFont);
    const handleSetLyricWordMode = useSettingsUiStore(state => state.handleSetLyricWordMode);
    const handleSetLyricFontPresetId = useSettingsUiStore(state => state.handleSetLyricFontPresetId);
    const handleSetVisualEffectIntensity = useSettingsUiStore(state => state.handleSetVisualEffectIntensity);
    const handleSetLyricEffectPackId = useSettingsUiStore(state => state.handleSetLyricEffectPackId);
    const [sliderVolume, setSliderVolume] = useState(isMuted ? 0 : volume);
    const [lyricsAdvancedOpen, setLyricsAdvancedOpen] = useState(false);
    const isDraggingRef = useRef(false);
    const pendingVolumeRef = useRef(sliderVolume);
    const optionStyles = getControlsTabOptionStyles(isDaylight);
    const { wellBg, sectionHintClass } = optionStyles;
    const hasLyricColorControls = Boolean(onApplyLyricBodyColor || onApplyLyricColorPreset);

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

                    <ControlsTabThemeSection
                        theme={theme}
                        onThemeChange={onThemeChange}
                        onBgModeChange={onBgModeChange}
                        hasCustomTheme={hasCustomTheme}
                        themeSourceModel={themeSourceModel}
                        defaultTheme={defaultTheme}
                        daylightTheme={daylightTheme}
                        visualizerMode={visualizerMode}
                        onVisualizerModeChange={onVisualizerModeChange}
                        visualizerBackgroundMode={visualizerBackgroundMode}
                        onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                        isDaylight={isDaylight}
                        onToggleDaylight={onToggleDaylight}
                        optionStyles={optionStyles}
                    />

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

                    {hasLyricColorControls ? (
                        <div className="space-y-1.5" data-testid="controls-lyric-color-section">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    {t('options.lyricColorPresetTitle') || '歌词颜色'}
                                </label>
                                <button
                                    type="button"
                                    data-testid="controls-toggle-lyrics-advanced"
                                    aria-expanded={lyricsAdvancedOpen}
                                    onClick={() => setLyricsAdvancedOpen(open => !open)}
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80 ${sectionHintClass}`}
                                >
                                    {lyricsAdvancedOpen
                                        ? (t('options.advancedSettingsHide') || '收起')
                                        : (t('options.moreLyricStyleSettings') || '取色 / 字体 / 特效')}
                                    <ChevronDown
                                        size={12}
                                        className={`transition-transform ${lyricsAdvancedOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </div>
                            {onApplyLyricColorPreset ? (
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
                                    {onApplyLyricBodyColor ? (
                                        <button
                                            type="button"
                                            data-testid="controls-open-lyric-color-picker"
                                            onClick={() => setLyricsAdvancedOpen(true)}
                                            className={`h-7 w-7 shrink-0 rounded-md border ${
                                                isDaylight ? 'border-black/15' : 'border-white/20'
                                            }`}
                                            style={{ backgroundColor: theme.primaryColor }}
                                            title={t('options.moreLyricStyleSettings') || '取色 / 字体 / 特效'}
                                            aria-label={t('options.moreLyricStyleSettings') || '取色 / 字体 / 特效'}
                                        />
                                    ) : null}
                                </div>
                            ) : null}

                            {lyricsAdvancedOpen ? (
                                <div
                                    className={`space-y-2 border-t pt-2 ${
                                        isDaylight ? 'border-black/10' : 'border-white/10'
                                    }`}
                                    data-testid="controls-lyrics-advanced-section"
                                >
                                    {onApplyLyricBodyColor ? (
                                        <div className={`${wellBg} p-1.5 rounded-lg`}>
                                            <LyricColorPicker
                                                compact
                                                color={theme.primaryColor}
                                                onChange={onApplyLyricBodyColor}
                                                isDaylight={isDaylight}
                                            />
                                        </div>
                                    ) : null}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
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
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
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
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                            {t('options.lyricEffectPack') || '歌词特效'}
                                        </label>
                                        <div className={`${wellBg} p-0.5 rounded-lg`}>
                                            <LyricEffectPackSelector
                                                selectedPackId={lyricEffectPackId}
                                                onPackChange={handleSetLyricEffectPackId}
                                                isDaylight={isDaylight}
                                                onApplySuggestion={(packId) => {
                                                    const suggestion = getLyricEffectPackSuggestion(packId);
                                                    if (suggestion.fontPresetId) {
                                                        handleSetLyricsCustomFont(null);
                                                        handleSetLyricFontPresetId(suggestion.fontPresetId);
                                                    }
                                                    if (suggestion.colorPresetId && onApplyLyricColorPreset) {
                                                        onApplyLyricColorPreset(suggestion.colorPresetId as Parameters<NonNullable<typeof onApplyLyricColorPreset>>[0]);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

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
