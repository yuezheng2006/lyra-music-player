import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Repeat1, RepeatOff, Heart, Sparkles, RotateCcw, Cone, Sun, Moon, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme, ThemeMode, VisualizerMode, type Interactive3dSceneTuning, type VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import { getVisualizerModeLabel, VISUALIZER_REGISTRY } from '../visualizer/registry';
import { useThemeQuickEditorStore } from '../../stores/useThemeQuickEditorStore';
import ControlsTabPlayerBackgroundSection from './ControlsTabPlayerBackgroundSection';
import { getControlsTabOptionButtonClass, getControlsTabOptionStyles } from './controlsTabOptionStyles';

// Controls tab keeps the visualizer picker local so it can expand into a full-tab overlay
// without changing the rest of the player state flow.

interface ControlsTabProps {
    loopMode: 'off' | 'all' | 'one';
    onToggleLoop: () => void;
    onLike: () => void;
    isLiked: boolean;
    onGenerateAITheme: () => void;
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
    bgMode,
    onBgModeChange,
    hasCustomTheme,
    themeSourceModel,
    onResetTheme,
    defaultTheme,
    daylightTheme,
    visualizerMode,
    onVisualizerModeChange,
    useCoverColorBg,
    onToggleCoverColorBg,
    isDaylight,
    onToggleDaylight,
    volume,
    isMuted,
    onVolumePreview,
    onVolumeChange,
    onToggleMute,
    loopToggleDisabled = false,
    visualizerBackgroundMode = null,
    interactive3dSceneTuning,
    enableSmartAtmosphere = true,
    disableVisualizerVignette = false,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    onToggleEnableSmartAtmosphere,
    onToggleDisableVisualizerVignette,
    onOpenAdvancedBackgroundSettings,
}) => {
    const { t } = useTranslation();
    const openThemeQuickEditor = useThemeQuickEditorStore(state => state.openEditor);
    const [sliderVolume, setSliderVolume] = useState(isMuted ? 0 : volume);
    const isDraggingRef = useRef(false);
    const pendingVolumeRef = useRef(sliderVolume);
    const optionStyles = getControlsTabOptionStyles(isDaylight);
    const animationIntensityModes: Array<'calm' | 'normal' | 'chaotic'> = ['calm', 'normal', 'chaotic'];

    useEffect(() => {
        if (!isDraggingRef.current) {
            const nextVolume = isMuted ? 0 : volume;
            setSliderVolume(nextVolume);
            pendingVolumeRef.current = nextVolume;
        }
    }, [volume, isMuted]);

    const loopButtonBg = isDaylight ? 'bg-black/5 hover:bg-zinc-300/85' : 'bg-white/5 hover:bg-white/10';
    const buttonBg = isDaylight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10';
    const { wellBg, sectionHintClass } = optionStyles;

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

    const toggleAnimationIntensity = (mode: 'calm' | 'normal' | 'chaotic') => {
        onThemeChange({ ...theme, animationIntensity: mode });
    };

    const handleVisualizerSelect = (mode: VisualizerMode) => {
        onVisualizerModeChange(mode);
    };

    const formatThemeDisplayName = (name: string) => {
        if (themeSourceModel.activeSource !== 'default') {
            return name;
        }

        return name === defaultTheme.name
            ? t('theme.midnightDefault')
            : (name === daylightTheme.name ? t('theme.daylightDefault') : name);
    };
    const activeThemeSource = themeSourceModel.current;
    const aiThemeSource = themeSourceModel.options.ai;
    const customThemeSource = themeSourceModel.options.custom;
    const currentEditableSource = themeSourceModel.editableSource;
    const themeDisplayName = formatThemeDisplayName(activeThemeSource.label || theme.name);
    const aiSwatchColor = aiThemeSource.theme?.backgroundColor ?? 'rgba(114,119,134,0.4)';
    const customSwatchColor = customThemeSource.theme?.accentColor ?? 'rgba(114,119,134,0.4)';
    const openCurrentThemeQuickEditor = () => {
        if (currentEditableSource) {
            openThemeQuickEditor(currentEditableSource);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={onToggleLoop}
                        disabled={loopToggleDisabled}
                        className={`h-12 rounded-xl flex items-center justify-center transition-colors ${loopButtonBg} ${loopToggleDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                    >
                        {loopMode === 'off' ? <RepeatOff size={20} /> : loopMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>

                    <button
                        onClick={onLike}
                        className={`h-12 rounded-xl flex items-center justify-center transition-colors ${isLiked ? 'bg-red-500/20 text-red-500' : buttonBg}`}
                    >
                        <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>

                    <button
                        onClick={onGenerateAITheme}
                        disabled={isGeneratingTheme || !canGenerateAITheme}
                        className={`h-12 rounded-xl flex items-center justify-center transition-colors ${isGeneratingTheme ? 'bg-blue-500/20 text-blue-300' : buttonBg}`}
                    >
                        <Sparkles size={20} className={isGeneratingTheme ? 'animate-pulse' : ''} />
                    </button>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {t('ui.volume') || 'Volume'}
                            </label>
                            <span className="text-[10px] font-bold opacity-60">
                                {Math.round(sliderVolume * 100)}%
                            </span>
                        </div>
                        <div className={`flex items-center gap-3 ${wellBg} p-2 rounded-xl`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleMute();
                                }}
                                className="opacity-40 hover:opacity-100 transition-opacity"
                            >
                                {isMuted || sliderVolume === 0 ? <VolumeX size={16} /> : sliderVolume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
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
                            />
                        </div>
                    </div>

                    <div className="space-y-2" data-testid="controls-lyrics-animation-section">
                        <div>
                            <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {t('ui.lyricsAnimationStyle') || t('ui.visualizer') || '歌词样式'}
                            </label>
                            <p className={`mt-1 text-[9px] leading-snug ${sectionHintClass}`}>
                                {t('ui.lyricsAnimationStyleDesc') || '播放页歌词的排版与动效模式'}
                            </p>
                        </div>
                        <div className={`grid grid-cols-4 gap-1 ${wellBg} p-1 rounded-xl`} data-testid="controls-visualizer-mode-group">
                            {VISUALIZER_REGISTRY.map((entry) => {
                                const isActive = entry.mode === visualizerMode;
                                return (
                                    <button
                                        key={entry.mode}
                                        type="button"
                                        data-testid={`controls-visualizer-mode-${entry.mode}`}
                                        onClick={() => handleVisualizerSelect(entry.mode)}
                                        className={`px-1 py-1.5 ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                                    >
                                        {getVisualizerModeLabel(entry.mode, t)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2" data-testid="controls-animation-intensity-section">
                        <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            {t('ui.animationIntensity') || '动画强度'}
                        </label>
                        <div className={`grid grid-cols-3 gap-1 ${wellBg} p-1 rounded-xl`} data-testid="controls-animation-intensity-group">
                            {animationIntensityModes.map((mode) => {
                                const isActive = theme.animationIntensity === mode;
                                return (
                                    <button
                                        key={mode}
                                        type="button"
                                        data-testid={`controls-animation-intensity-${mode}`}
                                        onClick={() => toggleAnimationIntensity(mode)}
                                        className={`py-1.5 capitalize ${getControlsTabOptionButtonClass(isActive, optionStyles)}`}
                                    >
                                        {t(`animation.${mode}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2" data-testid="controls-panel-theme-section">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                    {t('ui.panelTheme') || t('ui.background') || '界面配色'}
                                </label>
                                <p className={`mt-1 text-[9px] leading-snug ${sectionHintClass}`}>
                                    {t('ui.panelThemeDesc') || '面板与控件的日/夜配色方案'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={onToggleDaylight}
                                    className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-0.5 transition-all ${isDaylight ? 'text-amber-500' : 'text-blue-300'}`}
                                    title={isDaylight ? t('theme.switchToDark') : t('theme.switchToLight')}
                                    aria-label={t('ui.appearanceToggle') || '日/夜'}
                                >
                                    {isDaylight ? <Sun size={14} /> : <Moon size={14} />}
                                </button>
                                <button
                                    onClick={() => onToggleCoverColorBg(!useCoverColorBg)}
                                    className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-0.5 transition-all ${useCoverColorBg ? 'text-blue-500' : `${sectionHintClass} hover:opacity-100`}`}
                                    title={useCoverColorBg ? t('theme.addCoverColor') : t('theme.useDefaultColor')}
                                    aria-label={t('ui.coverColorTint') || '封面取色'}
                                >
                                    <Cone size={14} />
                                </button>
                            </div>
                        </div>
                        <div className={`grid ${hasCustomTheme ? 'grid-cols-3' : 'grid-cols-2'} gap-1 ${wellBg} p-1 rounded-xl`} data-testid="controls-panel-theme-group">
                            <button
                                type="button"
                                onClick={() => onBgModeChange('default')}
                                className={`py-1.5 flex items-center justify-center gap-2 ${getControlsTabOptionButtonClass(themeSourceModel.activeSource === 'default', optionStyles)}`}
                            >
                                <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: isDaylight ? daylightTheme.backgroundColor : defaultTheme.backgroundColor }} />
                                {t('ui.default')}
                            </button>
                            <button
                                type="button"
                                onClick={() => aiThemeSource.available && onBgModeChange('ai')}
                                disabled={!aiThemeSource.available}
                                className={`py-1.5 flex items-center justify-center gap-2 ${getControlsTabOptionButtonClass(themeSourceModel.activeSource === 'ai', optionStyles, !aiThemeSource.available)}`}
                            >
                                <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: aiSwatchColor }} />
                                {t('ui.aiTheme')}
                            </button>
                            {hasCustomTheme && (
                                <button
                                    type="button"
                                    onClick={() => onBgModeChange('custom')}
                                    className={`py-1.5 flex items-center justify-center gap-2 ${getControlsTabOptionButtonClass(themeSourceModel.activeSource === 'custom', optionStyles)}`}
                                >
                                    <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: customSwatchColor }} />
                                    {t('options.customTheme') || 'Custom'}
                                </button>
                            )}
                        </div>

                        <ControlsTabPlayerBackgroundSection
                            visualizerMode={visualizerMode}
                            visualizerBackgroundMode={visualizerBackgroundMode}
                            interactive3dSceneTuning={interactive3dSceneTuning}
                            enableSmartAtmosphere={enableSmartAtmosphere}
                            isDaylight={isDaylight}
                            onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange ?? (() => undefined)}
                            onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange ?? (() => undefined)}
                            onToggleEnableSmartAtmosphere={onToggleEnableSmartAtmosphere ?? (() => undefined)}
                            onOpenAdvancedBackgroundSettings={onOpenAdvancedBackgroundSettings}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {currentEditableSource ? (
                            <button
                                type="button"
                                onClick={openCurrentThemeQuickEditor}
                                className={`max-w-[120px] truncate rounded-md px-1.5 py-1 text-left text-xs font-bold transition-colors ${isDaylight ? 'hover:bg-black/10' : 'hover:bg-white/10'}`}
                                title={currentEditableSource === 'custom'
                                    ? (t('options.customThemeQuickEditTitle') || 'Edit Custom Theme')
                                    : (t('options.aiThemeQuickEditTitle') || 'Edit AI Theme')}
                            >
                                {themeDisplayName}
                            </button>
                        ) : (
                            <span className="text-xs font-bold truncate max-w-[120px]">
                                {themeDisplayName}
                            </span>
                        )}
                        {themeSourceModel.activeSource !== 'default' && (
                            <button
                                onClick={onResetTheme}
                                className={`p-1 rounded-full ${isDaylight ? 'hover:bg-black/10' : 'hover:bg-white/10'} transition-colors`}
                                title={t('ui.resetToDefaultTheme')}
                            >
                                <RotateCcw size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ControlsTab;
