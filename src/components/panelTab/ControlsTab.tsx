import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Repeat1, RepeatOff, Heart, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme, ThemeMode, VisualizerMode, type Interactive3dSceneTuning, type VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import { getControlsTabOptionStyles } from './controlsTabOptionStyles';
import ControlsTabCoreSection from './ControlsTabCoreSection';
import ControlsTabAdvancedSection from './ControlsTabAdvancedSection';
import { type LyricColorPresetId } from '../../utils/theme/lyricColorPresets';

// Controls tab: assembly layer — playback quick actions, core lyric settings, and a collapsed advanced area.

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
    const [sliderVolume, setSliderVolume] = useState(isMuted ? 0 : volume);
    const isDraggingRef = useRef(false);
    const pendingVolumeRef = useRef(sliderVolume);
    const optionStyles = getControlsTabOptionStyles(isDaylight);
    const { wellBg } = optionStyles;

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
                <div className="grid grid-cols-2 gap-1" data-testid="controls-quick-actions">
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

                    <ControlsTabCoreSection
                        theme={theme}
                        visualizerMode={visualizerMode}
                        onVisualizerModeChange={onVisualizerModeChange}
                        visualizerBackgroundMode={visualizerBackgroundMode}
                        interactive3dSceneTuning={interactive3dSceneTuning}
                        onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                        onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange}
                        onApplyLyricColorPreset={onApplyLyricColorPreset}
                        isDaylight={isDaylight}
                        optionStyles={optionStyles}
                    />

                    <ControlsTabAdvancedSection
                        theme={theme}
                        onThemeChange={onThemeChange}
                        onBgModeChange={onBgModeChange}
                        hasCustomTheme={hasCustomTheme}
                        themeSourceModel={themeSourceModel}
                        defaultTheme={defaultTheme}
                        daylightTheme={daylightTheme}
                        visualizerBackgroundMode={visualizerBackgroundMode}
                        onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                        isDaylight={isDaylight}
                        onToggleDaylight={onToggleDaylight}
                        optionStyles={optionStyles}
                        onGenerateAITheme={onGenerateAITheme}
                        isGeneratingTheme={isGeneratingTheme}
                        canGenerateAITheme={canGenerateAITheme}
                        onApplyLyricBodyColor={onApplyLyricBodyColor}
                        onApplyLyricColorPreset={onApplyLyricColorPreset}
                        onOpenAdvancedBackgroundSettings={onOpenAdvancedBackgroundSettings}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default ControlsTab;
