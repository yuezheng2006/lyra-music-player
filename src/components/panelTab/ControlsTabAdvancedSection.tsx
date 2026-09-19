import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme, ThemeMode, VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { getLyricEffectPackSuggestion } from '../../utils/lyricEffectPacks';
import type { LyricColorPresetId } from '../../utils/theme/lyricColorPresets';
import LyricWordModeToggle from '../shared/LyricWordModeToggle';
import LyricColorPicker from '../shared/LyricColorPicker';
import LyricVisualEffectSelector from '../shared/LyricVisualEffectSelector';
import LyricEffectPackSelector from '../shared/LyricEffectPackSelector';
import ControlsTabThemeSection from './ControlsTabThemeSection';
import { type ControlsTabOptionStyles } from './controlsTabOptionStyles';

// src/components/panelTab/ControlsTabAdvancedSection.tsx
// Controls tab: collapsed disclosure holding all advanced lyric + theme controls.

type ControlsTabAdvancedSectionProps = {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    onBgModeChange: (mode: ThemeMode) => void;
    hasCustomTheme: boolean;
    themeSourceModel: ThemeSourceModel;
    defaultTheme: Theme;
    daylightTheme: Theme;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    isDaylight: boolean;
    onToggleDaylight: () => void;
    optionStyles: ControlsTabOptionStyles;
    onGenerateAITheme: () => void;
    isGeneratingTheme: boolean;
    canGenerateAITheme: boolean;
    onApplyLyricBodyColor?: (color: string) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    onOpenAdvancedBackgroundSettings?: () => void;
};

const labelClass = 'text-[10px] font-bold uppercase tracking-widest opacity-40';

const ControlsTabAdvancedSection: React.FC<ControlsTabAdvancedSectionProps> = ({
    theme,
    onThemeChange,
    onBgModeChange,
    hasCustomTheme,
    themeSourceModel,
    defaultTheme,
    daylightTheme,
    visualizerBackgroundMode,
    onVisualizerBackgroundModeChange,
    isDaylight,
    onToggleDaylight,
    optionStyles,
    onGenerateAITheme,
    isGeneratingTheme,
    canGenerateAITheme,
    onApplyLyricBodyColor,
    onApplyLyricColorPreset,
    onOpenAdvancedBackgroundSettings,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const lyricEffectPackId = useSettingsUiStore(state => state.lyricEffectPackId);
    const handleSetLyricWordMode = useSettingsUiStore(state => state.handleSetLyricWordMode);
    const handleSetVisualEffectIntensity = useSettingsUiStore(state => state.handleSetVisualEffectIntensity);
    const handleSetLyricEffectPackId = useSettingsUiStore(state => state.handleSetLyricEffectPackId);
    const handleSetLyricFontPresetId = useSettingsUiStore(state => state.handleSetLyricFontPresetId);
    const handleSetLyricsCustomFont = useSettingsUiStore(state => state.handleSetLyricsCustomFont);
    const { wellBg, sectionHintClass } = optionStyles;

    return (
        <div className="space-y-2">
            <button
                type="button"
                data-testid="controls-toggle-lyrics-advanced"
                aria-expanded={open}
                onClick={() => setOpen(value => !value)}
                className={`flex w-full items-center justify-between gap-2 border-t border-white/5 pt-2 transition-opacity hover:opacity-80 ${sectionHintClass}`}
            >
                <span className={labelClass}>{t('ui.advanced') || 'Advanced'}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold">
                    {open ? (t('options.advancedSettingsHide') || '收起') : (t('options.advancedSettingsShow') || '展开')}
                    <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open ? (
                <div className="space-y-2.5" data-testid="controls-lyrics-advanced-section">
                    <LyricWordModeToggle
                        value={lyricWordMode}
                        onChange={handleSetLyricWordMode}
                        isDaylight={isDaylight}
                        sectionLabel={t('ui.lyricWordMode') || '逐字'}
                        defaultLabel={t('ui.lyricWordModeDefault') || '默认'}
                        karaokeLabel={t('ui.lyricWordModeKaraoke') || t('ui.visualizerKaraoke') || 'KTV'}
                        defaultHint={t('ui.lyricWordModeDefaultHint') || '整词点亮'}
                        karaokeHint={t('ui.lyricWordModeKaraokeHint') || '逐字按时长从 0% 填到 100%'}
                        wellClassName={wellBg}
                        testIdPrefix="controls-lyric-word-mode"
                    />

                    {onApplyLyricBodyColor ? (
                        <div className="space-y-1">
                            <span className={labelClass}>{t('ui.lyricColorPicker') || '取色'}</span>
                            <div className={`${wellBg} p-1.5 rounded-lg`}>
                                <LyricColorPicker
                                    compact
                                    color={theme.primaryColor}
                                    onChange={onApplyLyricBodyColor}
                                    isDaylight={isDaylight}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-1">
                        <span className={labelClass}>{t('options.visualEffectIntensity') || '效果强度'}</span>
                        <div className={`${wellBg} p-0.5 rounded-lg`}>
                            <LyricVisualEffectSelector
                                selectedIntensity={visualEffectIntensity}
                                onIntensityChange={handleSetVisualEffectIntensity}
                                isDaylight={isDaylight}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className={labelClass}>{t('options.lyricEffectPack') || '歌词特效'}</span>
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
                                        onApplyLyricColorPreset(suggestion.colorPresetId as LyricColorPresetId);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <ControlsTabThemeSection
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
                    />

                    {onOpenAdvancedBackgroundSettings ? (
                        <button
                            type="button"
                            data-testid="controls-open-more-settings"
                            onClick={onOpenAdvancedBackgroundSettings}
                            className={`w-full rounded-lg py-2 text-[10px] font-semibold transition-opacity hover:opacity-80 ${wellBg} ${sectionHintClass}`}
                        >
                            {t('ui.moreBackgroundSettings') || '更多…'}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default ControlsTabAdvancedSection;
