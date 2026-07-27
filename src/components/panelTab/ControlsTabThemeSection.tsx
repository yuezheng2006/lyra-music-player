import React from 'react';
import { Moon, Palette, Sparkles, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme, ThemeMode, VisualizerBackgroundMode } from '../../types';
import type { ThemeSourceModel } from '../../hooks/themeControllerState';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { useThemeQuickEditorStore } from '../../stores/useThemeQuickEditorStore';
import QuickEffectPicker from './QuickEffectPicker';
import type { ControlsTabOptionStyles } from './controlsTabOptionStyles';

// src/components/panelTab/ControlsTabThemeSection.tsx
// Advanced theme/background cluster: intensity, background engine, theme source, quick editor, AI generation.

const PLAYER_BACKGROUND_MODES: VisualizerBackgroundMode[] = ['interactive3d', 'common', 'monet', 'latent'];

type ControlsTabThemeSectionProps = {
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
};

const getBackgroundModeLabel = (
    mode: VisualizerBackgroundMode,
    t: (key: string) => string,
) => {
    switch (mode) {
        case 'interactive3d':
            return t('options.visualizerBackgroundModeInteractive3d') || '3D';
        case 'common':
            return t('options.visualizerBackgroundModeCommon') || 'Common';
        case 'monet':
            return t('options.visualizerBackgroundModeMonet') || 'Monet';
        case 'latent':
            return t('options.visualizerBackgroundModeLatent') || 'Latent';
        default:
            return mode;
    }
};

const ControlsTabThemeSection: React.FC<ControlsTabThemeSectionProps> = ({
    theme,
    onThemeChange,
    onBgModeChange,
    hasCustomTheme,
    themeSourceModel,
    defaultTheme,
    daylightTheme,
    visualizerBackgroundMode = null,
    onVisualizerBackgroundModeChange,
    isDaylight,
    onToggleDaylight,
    optionStyles,
    onGenerateAITheme,
    isGeneratingTheme,
    canGenerateAITheme,
}) => {
    const { t } = useTranslation();
    const openThemeQuickEditor = useThemeQuickEditorStore(state => state.openEditor);
    const setVisualizerBackgroundMode = useSettingsUiStore(state => state.handleSetVisualizerBackgroundMode);
    const { wellBg, activeOptionClass } = optionStyles;
    const activeOptionBg = activeOptionClass;

    const formatThemeDisplayName = (name: string) => {
        if (themeSourceModel.activeSource !== 'default') {
            return name;
        }
        return name === defaultTheme.name
            ? t('theme.midnightDefault')
            : (name === daylightTheme.name ? t('theme.daylightDefault') : name);
    };

    const aiThemeSource = themeSourceModel.options.ai;
    const customThemeSource = themeSourceModel.options.custom;
    const currentEditableSource = themeSourceModel.editableSource;
    const themeDisplayName = formatThemeDisplayName(themeSourceModel.current.label || theme.name);
    const aiSwatchColor = aiThemeSource.theme?.backgroundColor ?? 'rgba(114,119,134,0.4)';
    const customSwatchColor = customThemeSource.theme?.accentColor ?? 'rgba(114,119,134,0.4)';
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode);

    const backgroundOptions = PLAYER_BACKGROUND_MODES.map(mode => ({
        value: mode,
        label: getBackgroundModeLabel(mode, t),
    }));

    const toggleAnimationIntensity = () => {
        const modes: Array<'calm' | 'normal' | 'chaotic'> = ['calm', 'normal', 'chaotic'];
        const currentIndex = modes.indexOf(theme.animationIntensity);
        const nextIndex = (currentIndex + 1) % modes.length;
        onThemeChange({ ...theme, animationIntensity: modes[nextIndex] });
    };

    const openCurrentThemeQuickEditor = () => {
        if (currentEditableSource) {
            openThemeQuickEditor(currentEditableSource);
        }
    };

    const handleBackgroundChange = (mode: VisualizerBackgroundMode) => {
        if (onVisualizerBackgroundModeChange) {
            onVisualizerBackgroundModeChange(mode);
            return;
        }
        setVisualizerBackgroundMode(mode);
    };

    return (
        <div className="space-y-2" data-testid="controls-theme-section">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {t('ui.animationIntensity') || 'Intensity'}
                </span>
                <button
                    type="button"
                    onClick={toggleAnimationIntensity}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold capitalize transition-all ${activeOptionBg}`}
                    title={t('ui.animationIntensity') || 'Intensity'}
                >
                    {t(`animation.${theme.animationIntensity}`)}
                </button>
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                        {t('ui.background') || 'Background'}
                    </span>
                    <QuickEffectPicker<VisualizerBackgroundMode>
                        value={
                            PLAYER_BACKGROUND_MODES.includes(resolvedBackgroundMode)
                                ? resolvedBackgroundMode
                                : 'interactive3d'
                        }
                        options={backgroundOptions}
                        onChange={handleBackgroundChange}
                        isDaylight={isDaylight}
                        primaryColor={theme.primaryColor}
                        ariaLabel={t('options.visualizerBackgroundMode') || 'Background mode'}
                    />
                </div>

                <div className={`flex ${wellBg} rounded-xl p-1`} data-testid="controls-lyric-theme-source">
                    <button
                        type="button"
                        onClick={() => onBgModeChange('default')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                            themeSourceModel.activeSource === 'default' ? activeOptionBg : 'opacity-40 hover:opacity-100'
                        }`}
                    >
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: isDaylight ? daylightTheme.backgroundColor : defaultTheme.backgroundColor }}
                        />
                        {t('ui.default') || 'Default'}
                    </button>
                    <button
                        type="button"
                        onClick={() => aiThemeSource.available && onBgModeChange('ai')}
                        disabled={!aiThemeSource.available}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                            themeSourceModel.activeSource === 'ai'
                                ? activeOptionBg
                                : aiThemeSource.available
                                    ? 'opacity-40 hover:opacity-100'
                                    : 'cursor-not-allowed opacity-25'
                        }`}
                    >
                        <div
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: aiSwatchColor }}
                        />
                        {t('ui.aiTheme') || 'AI'}
                    </button>
                    {hasCustomTheme ? (
                        <button
                            type="button"
                            onClick={() => onBgModeChange('custom')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                                themeSourceModel.activeSource === 'custom' ? activeOptionBg : 'opacity-40 hover:opacity-100'
                            }`}
                        >
                            <div
                                className="h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: customSwatchColor }}
                            />
                            {t('options.customTheme') || 'Custom'}
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleDaylight}
                        className={`rounded-md p-1 transition-all ${isDaylight ? 'text-amber-500' : 'text-blue-300'}`}
                        title={isDaylight ? t('theme.switchToDark') : t('theme.switchToLight')}
                        aria-label={isDaylight ? t('theme.switchToDark') : t('theme.switchToLight')}
                    >
                        {isDaylight ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    {currentEditableSource ? (
                        <button
                            type="button"
                            data-testid="controls-open-theme-quick-editor"
                            onClick={openCurrentThemeQuickEditor}
                            className={`inline-flex max-w-[150px] items-center gap-1 truncate rounded-md px-1.5 py-1 text-left text-xs font-bold transition-colors ${
                                isDaylight ? 'hover:bg-black/10' : 'hover:bg-white/10'
                            }`}
                            title={currentEditableSource === 'custom'
                                ? (t('options.customThemeQuickEditTitle') || 'Edit custom theme')
                                : (t('options.aiThemeQuickEditTitle') || 'Edit AI theme')}
                        >
                            <Palette size={12} className="shrink-0 opacity-70" />
                            <span className="truncate">{themeDisplayName}</span>
                            <span className="shrink-0 text-[10px] font-semibold opacity-45">
                                {t('options.aiThemeQuickEditAction') || t('ui.edit') || '编辑'}
                            </span>
                        </button>
                    ) : (
                        <span className="max-w-[130px] truncate text-xs font-bold">
                            {themeDisplayName}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    data-testid="controls-generate-ai-theme"
                    onClick={onGenerateAITheme}
                    disabled={isGeneratingTheme || !canGenerateAITheme}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                        isGeneratingTheme
                            ? 'bg-blue-500/20 text-blue-300'
                            : canGenerateAITheme
                                ? (isDaylight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/16')
                                : 'cursor-not-allowed opacity-35'
                    }`}
                    title={t('ui.generateAITheme') || 'Generate Smart Theme'}
                >
                    <Sparkles size={12} className={isGeneratingTheme ? 'animate-pulse' : ''} />
                    {t('ui.aiTheme') || 'AI'}
                </button>
            </div>
        </div>
    );
};

export default ControlsTabThemeSection;
