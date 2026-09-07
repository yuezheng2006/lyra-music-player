import React, { useState } from 'react';
import { Monitor, Palette, Settings2, LayoutGrid, Download, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import {
    type DualTheme,
    type Theme,
    type ThemeMode,
} from '../../../types';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { usePerformanceMonitorStore } from '../../../stores/usePerformanceMonitorStore';
import { useAmbientVisualStore } from '../../../stores/useAmbientVisualStore';
import { useMagneticPullStore } from '../../../stores/useMagneticPullStore';
import { applyImportedAppearanceConfig, type AppearanceImportApplyStore } from '../../../utils/appearanceImportApply';
import {
    buildImportPlan,
    normalizeImportedAppearanceConfig,
    type ImportPlan,
} from '../../../utils/appearanceImportPlan';
import { compressConfig, decompressConfig } from '../../../utils/settings/visualSettingsConfig';
import {
    readStoredLyricBodyColor,
    readStoredLyricColorPresetId,
} from '../../../utils/theme/lyricColorPresets';
import SettingsAdvancedSection from './SettingsAdvancedSection';
import ImportConfirmDialog from './ImportConfirmDialog';
import StageTrackPillSettings from './StageTrackPillSettings';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsSectionTitleClass,
    settingsSectionTitleStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/AppearanceSettingsSubview.tsx
// Visual settings subview for theme presets, lyric renderer entry, layout settings, and configurations import/export.

type AppearanceSettingsSubviewProps = {
    accentOutlineColor: string;
    bgMode: ThemeMode;
    hasCustomTheme: boolean;
    isCustomThemePreferred: boolean;
    isDaylight: boolean;
    onApplyCustomTheme: () => void;
    onApplyDefaultTheme: () => void;
    onOpenThemePark: () => void;
    onOpenVisPlayground: () => void;
    onToggleSongThemeAutoGenerate: (enabled: boolean) => void;
    onToggleCustomThemePreferred: (enabled: boolean) => void;
    onToggleSongThemeAutoSwitch: (enabled: boolean) => void;
    onToggleTransparentPlayerBackground: (enabled: boolean) => void;
    onToggleAutoHidePlayerChrome: (enabled: boolean) => void;
    onSaveCustomTheme: (dualTheme: DualTheme) => void;
    settingsCardClass: string;
    songThemeAutoSwitchEnabled: boolean;
    songThemeAutoGenerateEnabled: boolean;
    theme?: Theme;
    themeParkInitialTheme: DualTheme;
    toggleOffBackgroundClass: string;
    transparentPlayerBackground: boolean;
    autoHidePlayerChrome: boolean;
    utilityGhostButtonClass: string;
    homeLayoutStyle: 'carousel' | 'grid';
    onChangeHomeLayoutStyle: (style: 'carousel' | 'grid') => void;
    grid3dCardStyle: 'image' | 'card';
    onChangeGrid3dCardStyle: (style: 'image' | 'card') => void;
    aiTheme?: DualTheme | null;
    customTheme?: DualTheme | null;
    hasAiApiKeyConfigured?: boolean;
    isElectronDesktop?: boolean;
};

export {
    compressConfig,
    compressTheme,
    decompressConfig,
    decompressTheme,
} from '../../../utils/settings/visualSettingsConfig';

const readSavedCustomTheme = (): DualTheme | undefined => {
    if (typeof window === 'undefined') return undefined;
    const saved = localStorage.getItem('custom_dual_theme');
    if (!saved) return undefined;
    try {
        return JSON.parse(saved) as DualTheme;
    } catch {
        return undefined;
    }
};

// ==========================================
// Component
// ==========================================

const AppearanceSettingsSubview: React.FC<AppearanceSettingsSubviewProps> = ({
    accentOutlineColor,
    bgMode,
    hasCustomTheme,
    isCustomThemePreferred,
    isDaylight,
    onApplyCustomTheme,
    onApplyDefaultTheme,
    onOpenThemePark,
    onOpenVisPlayground,
    onToggleSongThemeAutoGenerate,
    onToggleCustomThemePreferred,
    onToggleSongThemeAutoSwitch,
    onToggleTransparentPlayerBackground,
    onToggleAutoHidePlayerChrome,
    onSaveCustomTheme,
    settingsCardClass,
    songThemeAutoSwitchEnabled,
    songThemeAutoGenerateEnabled,
    theme,
    themeParkInitialTheme,
    toggleOffBackgroundClass,
    transparentPlayerBackground,
    autoHidePlayerChrome,
    utilityGhostButtonClass,
    homeLayoutStyle,
    onChangeHomeLayoutStyle,
    grid3dCardStyle,
    onChangeGrid3dCardStyle,
    aiTheme,
    customTheme,
    hasAiApiKeyConfigured = false,
    isElectronDesktop = false,
}) => {
    const { t } = useTranslation();
    const [importText, setImportText] = useState('');
    const [copiedType, setCopiedType] = useState<'none' | 'shortcode' | 'json'>('none');
    const [pendingImport, setPendingImport] = useState<{ config: Record<string, unknown>; plan: ImportPlan } | null>(null);

    const [exportThemeType, setExportThemeType] = useState<'custom' | 'ai' | 'none'>(() => {
        if (bgMode === 'ai' && aiTheme) return 'ai';
        if (customTheme) return 'custom';
        return 'none';
    });

    React.useEffect(() => {
        if (bgMode === 'ai' && aiTheme) {
            setExportThemeType('ai');
        } else if (customTheme) {
            setExportThemeType('custom');
        } else {
            setExportThemeType('none');
        }
    }, [aiTheme, customTheme, bgMode]);

    // Access ZUSTAND settings store directly for setters & configurations
    const store = useSettingsUiStore(useShallow(state => ({
        statusSetter: state.statusSetter,
        visualizerMode: state.visualizerMode,
        lyricWordMode: state.lyricWordMode,
        lyricFontPresetId: state.lyricFontPresetId,
        lyricEffectPackId: state.lyricEffectPackId,
        visualEffectIntensity: state.visualEffectIntensity,
        visualizerBackgroundMode: state.visualizerBackgroundMode,
        backgroundOpacity: state.backgroundOpacity,
        visualizerOpacity: state.visualizerOpacity,
        hidePlayerTranslationSubtitle: state.hidePlayerTranslationSubtitle,
        showSubtitleTranslation: state.showSubtitleTranslation,
        subtitleContentMode: state.subtitleContentMode,
        showHarmonySubtitle: state.showHarmonySubtitle,
        harmonySubtitleBackground: state.harmonySubtitleBackground,
        playbackPresentation: state.playbackPresentation,
        subtitleFontScale: state.subtitleFontScale,
        subtitleOverlayBackground: state.subtitleOverlayBackground,
        subtitleFontInheritsLyrics: state.subtitleFontInheritsLyrics,
        subtitleFontStyle: state.subtitleFontStyle,
        subtitleFontFamily: state.subtitleFontFamily,
        lyricsFontStyle: state.lyricsFontStyle,
        lyricsFontScale: state.lyricsFontScale,
        classicTuning: state.classicTuning,
        cadenzaTuning: state.cadenzaTuning,
        partitaTuning: state.partitaTuning,
        fumeTuning: state.fumeTuning,
        claddaghTuning: state.claddaghTuning,
        cappellaTuning: state.cappellaTuning,
        tiltTuning: state.tiltTuning,
        pendoloTuning: state.pendoloTuning,
        monetBackgroundTuning: state.monetBackgroundTuning,
        latentBackgroundTuning: state.latentBackgroundTuning,
        nomandBackgroundTuning: state.nomandBackgroundTuning,
        interactive3dSceneTuning: state.interactive3dSceneTuning,
        monetTuning: state.monetTuning,
        urlBackgroundList: state.urlBackgroundList,
        urlBackgroundSelectedId: state.urlBackgroundSelectedId,
        enableSmartAtmosphere: state.enableSmartAtmosphere,
        enable3dInteractiveBackground: state.enable3dInteractiveBackground,

        handleSetVisualizerMode: state.handleSetVisualizerMode,
        handleSetLyricWordMode: state.handleSetLyricWordMode,
        handleSetLyricFontPresetId: state.handleSetLyricFontPresetId,
        handleSetLyricEffectPackId: state.handleSetLyricEffectPackId,
        handleSetVisualEffectIntensity: state.handleSetVisualEffectIntensity,
        handleSetVisualizerBackgroundMode: state.handleSetVisualizerBackgroundMode,
        handleSetBackgroundOpacity: state.handleSetBackgroundOpacity,
        handleSetVisualizerOpacity: state.handleSetVisualizerOpacity,
        handleToggleHidePlayerTranslationSubtitle: state.handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation: state.handleToggleShowSubtitleTranslation,
        handleSetSubtitleContentMode: state.handleSetSubtitleContentMode,
        handleToggleShowHarmonySubtitle: state.handleToggleShowHarmonySubtitle,
        handleToggleHarmonySubtitleBackground: state.handleToggleHarmonySubtitleBackground,
        handleSetPlaybackPresentation: state.handleSetPlaybackPresentation,
        handleToggleSpeakerStage: state.handleToggleSpeakerStage,
        handleSetSubtitleFontScale: state.handleSetSubtitleFontScale,
        handleToggleSubtitleOverlayBackground: state.handleToggleSubtitleOverlayBackground,
        handleSetSubtitleFontInheritsLyrics: state.handleSetSubtitleFontInheritsLyrics,
        handleSetSubtitleFontStyle: state.handleSetSubtitleFontStyle,
        handleSetSubtitleFontFamily: state.handleSetSubtitleFontFamily,
        handleSetLyricsFontStyle: state.handleSetLyricsFontStyle,
        handleSetLyricsFontScale: state.handleSetLyricsFontScale,
        handleSetClassicTuning: state.handleSetClassicTuning,
        handleSetCadenzaTuning: state.handleSetCadenzaTuning,
        handleSetPartitaTuning: state.handleSetPartitaTuning,
        handleSetFumeTuning: state.handleSetFumeTuning,
        handleSetCladdaghTuning: state.handleSetCladdaghTuning,
        handleSetCappellaTuning: state.handleSetCappellaTuning,
        handleSetTiltTuning: state.handleSetTiltTuning,
        handleSetPendoloTuning: state.handleSetPendoloTuning,
        handleSetMonetBackgroundTuning: state.handleSetMonetBackgroundTuning,
        handleSetLatentBackgroundTuning: state.handleSetLatentBackgroundTuning,
        handleSetNomandBackgroundTuning: state.handleSetNomandBackgroundTuning,
        handleSetInteractive3dSceneTuning: state.handleSetInteractive3dSceneTuning,
        handleSetMonetTuning: state.handleSetMonetTuning,
        handleSetUrlBackgroundList: state.handleSetUrlBackgroundList,
        handleSetUrlBackgroundSelectedId: state.handleSetUrlBackgroundSelectedId,
        handleToggleEnableSmartAtmosphere: state.handleToggleEnableSmartAtmosphere,
        handleToggleEnable3dInteractiveBackground: state.handleToggleEnable3dInteractiveBackground,
        stageTrackPillMode: state.stageTrackPillMode,
        stageTrackPillTimeoutSec: state.stageTrackPillTimeoutSec,
        stageTrackPillOnHome: state.stageTrackPillOnHome,
        handleSetStageTrackPillMode: state.handleSetStageTrackPillMode,
        handleSetStageTrackPillTimeoutSec: state.handleSetStageTrackPillTimeoutSec,
        handleToggleStageTrackPillOnHome: state.handleToggleStageTrackPillOnHome,
    })));

    const getAccentOptionStyle = (selected: boolean) => (
        selected
            ? {
                borderColor: accentOutlineColor,
                boxShadow: `inset 0 0 0 1px ${accentOutlineColor}`,
                backgroundColor: isDaylight ? `${accentOutlineColor}12` : `${accentOutlineColor}18`,
            }
            : {
                borderColor: isDaylight ? 'rgba(24, 24, 27, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: isDaylight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.05)',
            }
    );

    const buildCurrentConfig = () => {
        let exportTheme: DualTheme | null = null;
        if (exportThemeType === 'custom') {
            exportTheme = customTheme || readSavedCustomTheme() || null;
        } else if (exportThemeType === 'ai') {
            exportTheme = aiTheme || null;
        }
        return {
            theme: exportTheme,
            visualizerMode: store.visualizerMode,
            lyricWordMode: store.lyricWordMode,
            lyricFontPresetId: store.lyricFontPresetId,
            lyricEffectPackId: store.lyricEffectPackId,
            visualEffectIntensity: store.visualEffectIntensity,
            visualizerBackgroundMode: store.visualizerBackgroundMode,
            backgroundOpacity: store.backgroundOpacity,
            visualizerOpacity: store.visualizerOpacity,
            hidePlayerTranslationSubtitle: store.hidePlayerTranslationSubtitle,
            showSubtitleTranslation: store.showSubtitleTranslation,
            subtitleContentMode: store.subtitleContentMode,
            showHarmonySubtitle: store.showHarmonySubtitle,
            harmonySubtitleBackground: store.harmonySubtitleBackground,
            playbackPresentation: store.playbackPresentation,
            subtitleFontScale: store.subtitleFontScale,
            subtitleOverlayBackground: store.subtitleOverlayBackground,
            subtitleFontInheritsLyrics: store.subtitleFontInheritsLyrics,
            subtitleFontStyle: store.subtitleFontStyle,
            subtitleFontFamily: store.subtitleFontFamily,
            lyricsFontStyle: store.lyricsFontStyle,
            lyricsFontScale: store.lyricsFontScale,
            lyricColorPresetId: readStoredLyricColorPresetId(),
            lyricBodyColor: readStoredLyricBodyColor(),
            classicTuning: store.classicTuning,
            cadenzaTuning: store.cadenzaTuning,
            partitaTuning: store.partitaTuning,
            fumeTuning: store.fumeTuning,
            claddaghTuning: store.claddaghTuning,
            cappellaTuning: store.cappellaTuning,
            tiltTuning: store.tiltTuning,
            pendoloTuning: store.pendoloTuning,
            monetBackgroundTuning: store.monetBackgroundTuning,
            latentBackgroundTuning: store.latentBackgroundTuning,
            nomandBackgroundTuning: store.nomandBackgroundTuning,
            interactive3dSceneTuning: store.interactive3dSceneTuning,
            monetTuning: store.monetTuning,
            urlBackgroundList: store.urlBackgroundList,
            urlBackgroundSelectedId: store.urlBackgroundSelectedId,
            songThemeAutoSwitchEnabled,
            songThemeAutoGenerateEnabled,
            enableSmartAtmosphere: store.enableSmartAtmosphere,
            enable3dInteractiveBackground: store.enable3dInteractiveBackground,
            performanceMode: usePerformanceMonitorStore.getState().mode,
            ambientVisualEnabled: useAmbientVisualStore.getState().enabled,
            magneticPullEnabled: useMagneticPullStore.getState().enabled,
            emotionScrambleEnabled: useMagneticPullStore.getState().scrambleEnabled,
            emotionBeatPulseEnabled: useMagneticPullStore.getState().beatPulseEnabled,
            stageTrackPillMode: store.stageTrackPillMode,
            stageTrackPillTimeoutSec: store.stageTrackPillTimeoutSec,
            stageTrackPillOnHome: store.stageTrackPillOnHome,
        };
    };

    const handleCopyShortcode = async () => {
        const config = buildCurrentConfig();
        const code = compressConfig(config);
        try {
            await navigator.clipboard.writeText(code);
            setCopiedType('shortcode');
            setTimeout(() => setCopiedType('none'), 2000);
            store.statusSetter?.({ type: 'success', text: t('status.copied') || '已复制' });
        } catch (err) {
            console.error('Failed to copy shortcode:', err);
        }
    };

    const handleCopyJson = async () => {
        const config = buildCurrentConfig();
        const code = JSON.stringify(config, null, 2);
        try {
            await navigator.clipboard.writeText(code);
            setCopiedType('json');
            setTimeout(() => setCopiedType('none'), 2000);
            store.statusSetter?.({ type: 'success', text: t('status.copied') || '已复制' });
        } catch (err) {
            console.error('Failed to copy JSON:', err);
        }
    };

    const handleImportConfig = () => {
        if (!importText.trim()) return;
        try {
            const config = normalizeImportedAppearanceConfig(decompressConfig(importText));
            const uiStore = useSettingsUiStore.getState();
            const plan = buildImportPlan({
                incoming: config,
                current: { ...buildCurrentConfig(), theme: customTheme ?? readSavedCustomTheme() ?? null },
                switches: { isCustomThemePreferred, songThemeAutoSwitchEnabled, songThemeAutoGenerateEnabled },
                isCustomThemeActive: bgMode === 'custom',
                assets: {
                    hasCappellaEmojiPack: uiStore.storedCappellaEmojiPack.length > 0,
                    hasMonetBackgroundImage: Boolean(uiStore.storedMonetBackgroundImage),
                    hasMonetPortraitImage: Boolean(uiStore.storedMonetPortraitImage),
                },
            });
            setPendingImport({ config, plan });
        } catch (err) {
            console.error('Import settings failed:', err);
            store.statusSetter?.({ type: 'error', text: t('options.importFailed') || '配置导入失败，请检查格式是否正确。' });
        }
    };

    const handleConfirmImport = (keys: string[]) => {
        if (!pendingImport) return;
        try {
            applyImportedAppearanceConfig({
                config: pendingImport.config,
                keys,
                customTheme,
                onSaveCustomTheme,
                onApplyCustomTheme,
                onToggleSongThemeAutoSwitch,
                onToggleSongThemeAutoGenerate,
                store: store as unknown as AppearanceImportApplyStore,
                setPerformanceMode: mode => usePerformanceMonitorStore.getState().setMode(mode),
                setAmbientVisualEnabled: enabled => useAmbientVisualStore.getState().setEnabled(enabled),
                setMagneticPullEnabled: enabled => useMagneticPullStore.getState().setEnabled(enabled),
                setEmotionScrambleEnabled: enabled => useMagneticPullStore.getState().setScrambleEnabled(enabled),
                setEmotionBeatPulseEnabled: enabled => useMagneticPullStore.getState().setBeatPulseEnabled(enabled),
            });
            store.statusSetter?.({ type: 'success', text: t('options.importSuccess') || '配置导入成功！' });
            setImportText('');
        } catch (err) {
            console.error('Import settings failed:', err);
            store.statusSetter?.({ type: 'error', text: t('options.importFailed') || '配置导入失败，请检查格式是否正确。' });
        } finally {
            setPendingImport(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Theme presets and edit options */}
            <section className="space-y-3">
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Palette size={14} /> {t('options.themePresets') || '主题与配色'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.themePresets') || '主题配色预设'}
                        </div>
                        <button
                            type="button"
                            onClick={onOpenThemePark}
                            className={`shrink-0 w-9 h-9 rounded-full border transition-colors flex items-center justify-center ${utilityGhostButtonClass}`}
                            style={{ color: 'var(--text-primary)' }}
                            title={t('options.openThemePark') || '打开 Theme Park'}
                            aria-label={t('options.openThemePark') || '打开 Theme Park'}
                        >
                            <Palette size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onApplyDefaultTheme}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                            style={{
                                ...getAccentOptionStyle(bgMode === 'default'),
                                backgroundColor: bgMode === 'default'
                                    ? (isDaylight ? `${accentOutlineColor}12` : `${accentOutlineColor}18`)
                                    : (isDaylight ? 'rgba(24, 24, 27, 0.035)' : 'rgba(9, 9, 11, 0.5)'),
                            }}
                        >
                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${themeParkInitialTheme.light.backgroundColor}, ${themeParkInitialTheme.dark.backgroundColor})`, borderColor: isDaylight ? 'rgba(24,24,27,0.08)' : 'rgba(255,255,255,0.15)' }} />
                            <span className="text-xs font-semibold" style={{ color: isDaylight ? '#27272a' : '#e4e4e7' }}>{t('options.themePresetsDefault') || 'Default'}</span>
                        </button>
                        <button
                            onClick={onApplyCustomTheme}
                            disabled={!hasCustomTheme}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                ...getAccentOptionStyle(bgMode === 'custom'),
                                backgroundColor: bgMode === 'custom'
                                    ? (isDaylight ? `${accentOutlineColor}12` : `${accentOutlineColor}18`)
                                    : (isDaylight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.08)'),
                            }}
                        >
                            <div className="w-6 h-6 rounded-full" style={{ background: hasCustomTheme ? `linear-gradient(135deg, ${themeParkInitialTheme.light.accentColor}, ${themeParkInitialTheme.dark.accentColor})` : 'rgba(114,119,134,0.4)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t('options.customTheme') || 'Custom'}</span>
                        </button>
                    </div>
                </div>
                <SettingsAdvancedSection>
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={settingsTitleClass} style={settingsTitleStyle}>
                                {t('options.preferCustomTheme') || '优先使用自定义主题'}
                            </div>
                            <div className={settingsDescClass} style={settingsDescStyle}>
                                {t('options.preferCustomThemeDesc') || '开启后会关闭歌曲主题自动切换。'}
                            </div>
                        </div>
                        <button
                            onClick={() => hasCustomTheme && onToggleCustomThemePreferred(!isCustomThemePreferred)}
                            disabled={!hasCustomTheme}
                            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!isCustomThemePreferred ? toggleOffBackgroundClass : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                            style={{ backgroundColor: isCustomThemePreferred ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isCustomThemePreferred ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={settingsTitleClass} style={settingsTitleStyle}>
                                {t('options.autoSwitchSongTheme') || '主题自动切换'}
                            </div>
                            <div className={settingsDescClass} style={settingsDescStyle}>
                                {t('options.autoSwitchSongThemeDesc') || '当切换到的歌曲曾经生成过 AI 主题的时候，自动应用 AI 主题。'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleSongThemeAutoSwitch(!songThemeAutoSwitchEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!songThemeAutoSwitchEnabled ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: songThemeAutoSwitchEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${songThemeAutoSwitchEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {songThemeAutoSwitchEnabled && (
                        <div className={`p-3 rounded-xl border space-y-2 ${settingsCardClass}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {t('options.autoGenerateSongTheme') || '自动为播放歌曲进行主题生成'}
                                    </div>
                                    <div className={settingsDescClass} style={settingsDescStyle}>
                                        {t('options.autoGenerateSongThemeDesc') || '当播放歌曲没有缓存 AI 主题时，自动调用AI并应用（会产生较高token费用！）'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onToggleSongThemeAutoGenerate(!songThemeAutoGenerateEnabled)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!songThemeAutoGenerateEnabled ? toggleOffBackgroundClass : ''}`}
                                    style={{ backgroundColor: songThemeAutoGenerateEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${songThemeAutoGenerateEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {!hasAiApiKeyConfigured && (
                                <div className={settingsDescClass} style={settingsDescStyle}>
                                    {isElectronDesktop
                                        ? (t('options.autoGenerateSongThemeNeedsKey') || '请先在桌面设置中填写 AI API Key，否则自动生成不会生效。')
                                        : (t('options.autoGenerateSongThemeNeedsDesktopKey') || '自动生成主题需要在桌面端设置中填写 AI API Key。')}
                                </div>
                            )}
                        </div>
                    )}
                </SettingsAdvancedSection>
            </section>

            {/* Section 2: Lyrics Animation & Player View */}
            <section className="space-y-3">
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Monitor size={14} /> {t('options.lyricsRenderer') || '歌词与播放页'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="space-y-1">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.lyricsRenderer') || '歌词动画'}
                        </div>
                        <div className={settingsDescClass} style={settingsDescStyle}>
                            {t('options.lyricsRendererDesc') || '选择播放页使用的歌词渲染模式。'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenVisPlayground}
                        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${utilityGhostButtonClass}`}
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <Settings2 size={16} />
                        <span>{t('options.lyricsAnimationAdjust') || '歌词动画样式'}</span>
                    </button>
                </div>
                <SettingsAdvancedSection>
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                {t('options.transparentPlayerBackground') || '播放页透明背景'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                {t('options.transparentPlayerBackgroundDesc') || '仅对播放页生效。开启后会切换到透明窗口模式，适合 OBS 抠像。'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleTransparentPlayerBackground(!transparentPlayerBackground)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!transparentPlayerBackground ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: transparentPlayerBackground ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${transparentPlayerBackground ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                {t('options.autoHidePlayerChrome') || '自动隐藏控制栏'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                {t('options.autoHidePlayerChromeDesc') || '开启后，鼠标空闲约 10 秒会自动隐藏播放页底栏与右侧面板按钮。也可按 H 键切换。'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleAutoHidePlayerChrome(!autoHidePlayerChrome)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!autoHidePlayerChrome ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: autoHidePlayerChrome ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoHidePlayerChrome ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <StageTrackPillSettings
                        theme={theme}
                        settingsCardClass={settingsCardClass}
                        toggleOffBackgroundClass={toggleOffBackgroundClass}
                        getAccentOptionStyle={getAccentOptionStyle}
                        stageTrackPillMode={store.stageTrackPillMode}
                        stageTrackPillTimeoutSec={store.stageTrackPillTimeoutSec}
                        stageTrackPillOnHome={store.stageTrackPillOnHome}
                        onChangeStageTrackPillMode={store.handleSetStageTrackPillMode}
                        onChangeStageTrackPillTimeoutSec={store.handleSetStageTrackPillTimeoutSec}
                        onToggleStageTrackPillOnHome={store.handleToggleStageTrackPillOnHome}
                    />
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                {t('options.speakerStage') || '音箱舞台'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                {t('options.speakerStageDesc') || '全屏沉浸呈现：弱化播控、玻璃景深与 MoodLyric 悬浮歌词。'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => store.handleToggleSpeakerStage()}
                            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${store.playbackPresentation !== 'speaker' ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: store.playbackPresentation === 'speaker' ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${store.playbackPresentation === 'speaker' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </SettingsAdvancedSection>
            </section>

            {/* Section 3: Home Layout styles */}
            <section className="space-y-3">
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <LayoutGrid size={14} /> {t('options.homeLayoutStyle') || '主页布局与风格'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="space-y-1">
                        <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                            {t('options.homeLayoutStyle') || '首页布局样式'}
                        </div>
                        <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                            {t('options.homeLayoutStyleDesc') || '选择首页展示的样式风格：经典(旧版)或万象(新版)透明桌面（支持拍立得单曲网格）。'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onChangeHomeLayoutStyle('carousel')}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                            style={getAccentOptionStyle(homeLayoutStyle === 'carousel')}
                        >
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {t('options.homeLayoutStyleCarousel') || '经典(旧版)'}
                            </span>
                        </button>
                        <button
                            onClick={() => onChangeHomeLayoutStyle('grid')}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                            style={getAccentOptionStyle(homeLayoutStyle === 'grid')}
                        >
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {t('options.homeLayoutStyleGrid') || '万象(新版)'}
                            </span>
                        </button>
                    </div>
                </div>
                {homeLayoutStyle === 'grid' && (
                    <SettingsAdvancedSection>
                        <div className={`p-4 rounded-xl border space-y-3 ${settingsCardClass}`}>
                            <div className="space-y-1">
                                <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                    {t('options.grid3dCardStyle') || '3D 网格卡片样式'}
                                </div>
                                <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                    {t('options.grid3dCardStyleDesc') || '选择 3D 网格中每张卡片的外观：纯图片封面或经典的拍立得文本卡片。'}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <button
                                    onClick={() => onChangeGrid3dCardStyle('image')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                                    style={getAccentOptionStyle(grid3dCardStyle === 'image')}
                                >
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {t('options.grid3dCardStyleImage') || '纯图片封面'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => onChangeGrid3dCardStyle('card')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                                    style={getAccentOptionStyle(grid3dCardStyle === 'card')}
                                >
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {t('options.grid3dCardStyleCard') || '拍立得卡片'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </SettingsAdvancedSection>
                )}
            </section>

            {/* Section 4: Configurations Import/Export (New feature) */}
            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Settings2 size={14} /> {t('options.importExportTitle') || '备份与导入'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="space-y-1">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.importExportTitle') || '备份与导入配置'}
                        </div>
                        <div className={`${settingsDescClass} max-w-[400px]`} style={settingsDescStyle}>
                            {t('options.importExportDesc') || '通过标准 JSON 或 auralis-theme 文本导入/导出配色主题与歌词动画设置。'}
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <div className={settingsDescClass} style={settingsDescStyle}>
                            {t('options.exportThemeLabel') || '导出时包含的主题'}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {aiTheme && (
                                <button
                                    type="button"
                                    onClick={() => setExportThemeType('ai')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5"
                                    style={getAccentOptionStyle(exportThemeType === 'ai')}
                                >
                                    <Palette size={12} className="opacity-70" />
                                    <span>{t('options.exportAiTheme') || 'AI 主题'}: {aiTheme.light.name || 'AI'}</span>
                                </button>
                            )}
                            {customTheme && (
                                <button
                                    type="button"
                                    onClick={() => setExportThemeType('custom')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5"
                                    style={getAccentOptionStyle(exportThemeType === 'custom')}
                                >
                                    <Palette size={12} className="opacity-70" />
                                    <span>{t('options.exportCustomTheme') || '自定义主题'}: {customTheme.light.name || 'Custom'}</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setExportThemeType('none')}
                                className="px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5"
                                style={getAccentOptionStyle(exportThemeType === 'none')}
                            >
                                <Settings2 size={12} className="opacity-70" />
                                <span>{t('options.exportNoTheme') || '不包含主题'}</span>
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder={t('options.importPlaceholder') || '在此处粘贴备份文本，或直接输入标准 JSON...'}
                        className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-white/30 transition-colors font-mono resize-none"
                        style={{ color: 'var(--text-primary)' }}
                    />

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleCopyShortcode}
                            className="px-3 py-2 bg-white/15 hover:bg-white/20 active:bg-white/10 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {copiedType === 'shortcode' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            <span>{copiedType === 'shortcode' ? (t('status.copied') || '已复制') : (t('options.exportBtn') || '复制配置码')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyJson}
                            className="px-3 py-2 bg-white/10 hover:bg-white/15 active:bg-white/5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {copiedType === 'json' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            <span>{copiedType === 'json' ? (t('status.copied') || '已复制') : '复制 JSON'}</span>
                        </button>
                        <div className="flex-1 min-w-[20px]" />
                        <button
                            type="button"
                            onClick={handleImportConfig}
                            disabled={!importText.trim()}
                            className="px-4 py-2 bg-white/20 hover:bg-white/25 active:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                            style={{ color: 'var(--text-primary)', borderColor: accentOutlineColor }}
                        >
                            <Download size={13} />
                            <span>{t('options.importBtn') || '导入配置'}</span>
                        </button>
                    </div>
                </div>
            </section>
            <ImportConfirmDialog
                isOpen={Boolean(pendingImport)}
                plan={pendingImport?.plan ?? null}
                isDaylight={isDaylight}
                onCancel={() => setPendingImport(null)}
                onConfirm={handleConfirmImport}
            />
        </div>
    );
};

export default AppearanceSettingsSubview;
