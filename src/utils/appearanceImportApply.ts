import type { DualTheme, UrlBackgroundItem } from '../types';
import {
    getLyricColorPresetById,
    normalizeLyricColorPresetId,
    saveStoredLyricBodyColor,
    saveStoredLyricColorPresetId,
} from './theme/lyricColorPresets';
import { parsePerformanceMode } from './performance/performanceMonitorMath';
import { mergeUrlBackgroundList } from './urlBackground';
import {
    clampStageTrackPillTimeoutSec,
    parseStageTrackPillMode,
} from './settings/stageTrackPillSettingsMath';
import {
    ACTIVATE_CUSTOM_THEME_KEY,
    THEME_DARK_KEY,
    THEME_LIGHT_KEY,
} from './appearanceImportPlan';

// src/utils/appearanceImportApply.ts
// Apply a subset of an imported appearance config. `keys` are the plan's change keys; anything not
// picked is left exactly as it is.

export type AppearanceImportApplyStore = {
    urlBackgroundList: UrlBackgroundItem[];
    handleSetVisualizerMode: (mode: string) => void;
    handleSetLyricWordMode: (mode: string) => void;
    handleSetLyricFontPresetId: (id: string) => void;
    handleSetLyricEffectPackId: (id: string) => void;
    handleSetVisualEffectIntensity: (value: string) => void;
    handleSetVisualizerBackgroundMode: (mode: string) => void;
    handleSetBackgroundOpacity: (value: number) => void;
    handleSetVisualizerOpacity: (value: number) => void;
    handleToggleHidePlayerTranslationSubtitle: (value: boolean) => void;
    handleToggleShowSubtitleTranslation: (value: boolean) => void;
    handleSetSubtitleContentMode: (mode: 'translation' | 'romanization' | 'none') => void;
    handleToggleShowHarmonySubtitle: (value: boolean) => void;
    handleToggleHarmonySubtitleBackground: (value: boolean) => void;
    handleSetPlaybackPresentation: (value: 'speaker' | 'default') => void;
    handleSetSubtitleFontScale: (value: number) => void;
    handleToggleSubtitleOverlayBackground: (value: boolean) => void;
    handleSetSubtitleFontInheritsLyrics: (value: boolean) => void;
    handleSetSubtitleFontStyle: (value: string) => void;
    handleSetSubtitleFontFamily: (value: string | null) => void;
    handleSetLyricsFontStyle: (value: string) => void;
    handleSetLyricsFontScale: (value: number) => void;
    handleSetClassicTuning: (patch: Record<string, unknown>) => void;
    handleSetCadenzaTuning: (patch: Record<string, unknown>) => void;
    handleSetPartitaTuning: (patch: Record<string, unknown>) => void;
    handleSetFumeTuning: (patch: Record<string, unknown>) => void;
    handleSetCladdaghTuning: (patch: Record<string, unknown>) => void;
    handleSetCappellaTuning: (patch: Record<string, unknown>) => void;
    handleSetTiltTuning: (patch: Record<string, unknown>) => void;
    handleSetPendoloTuning: (patch: Record<string, unknown>) => void;
    handleSetMonetBackgroundTuning: (patch: Record<string, unknown>) => void;
    handleSetLatentBackgroundTuning: (patch: Record<string, unknown>) => void;
    handleSetNomandBackgroundTuning: (patch: Record<string, unknown>) => void;
    handleSetInteractive3dSceneTuning: (patch: Record<string, unknown>) => void;
    handleSetMonetTuning: (patch: Record<string, unknown>) => void;
    handleSetUrlBackgroundList: (items: UrlBackgroundItem[]) => void;
    handleSetUrlBackgroundSelectedId: (id: string | null) => void;
    handleToggleEnableSmartAtmosphere: (value: boolean) => void;
    handleToggleEnable3dInteractiveBackground: (value: boolean) => void;
    handleSetStageTrackPillMode: (mode: string) => void;
    handleSetStageTrackPillTimeoutSec: (timeoutSec: number) => void;
    handleToggleStageTrackPillOnHome: (enabled: boolean) => void;
};

export type AppearanceImportApplyDeps = {
    config: Record<string, unknown>;
    keys: string[];
    customTheme?: DualTheme | null;
    onSaveCustomTheme: (dualTheme: DualTheme) => void;
    onApplyCustomTheme: () => void;
    onToggleSongThemeAutoSwitch: (enabled: boolean) => void;
    onToggleSongThemeAutoGenerate: (enabled: boolean) => void;
    store: AppearanceImportApplyStore;
    setPerformanceMode: (mode: ReturnType<typeof parsePerformanceMode>) => void;
    setAmbientVisualEnabled: (enabled: boolean) => void;
    setMagneticPullEnabled: (enabled: boolean) => void;
    setEmotionScrambleEnabled: (enabled: boolean) => void;
    setEmotionBeatPulseEnabled: (enabled: boolean) => void;
};

export function applyImportedAppearanceConfig({
    config,
    keys,
    customTheme,
    onSaveCustomTheme,
    onApplyCustomTheme,
    onToggleSongThemeAutoSwitch,
    onToggleSongThemeAutoGenerate,
    store,
    setPerformanceMode,
    setAmbientVisualEnabled,
    setMagneticPullEnabled,
    setEmotionScrambleEnabled,
    setEmotionBeatPulseEnabled,
}: AppearanceImportApplyDeps): void {
    const has = (key: string) => keys.includes(key);
    const incomingTheme = config.theme as DualTheme | undefined;

    const savesTheme = Boolean(incomingTheme) && (has(THEME_LIGHT_KEY) || has(THEME_DARK_KEY));
    if (savesTheme && incomingTheme) {
        const base = customTheme ?? incomingTheme;
        onSaveCustomTheme({
            light: has(THEME_LIGHT_KEY) ? incomingTheme.light : base.light,
            dark: has(THEME_DARK_KEY) ? incomingTheme.dark : base.dark,
        });
    } else if (has(ACTIVATE_CUSTOM_THEME_KEY)) {
        onApplyCustomTheme();
    }

    if (has('visualizerMode') && typeof config.visualizerMode === 'string') {
        store.handleSetVisualizerMode(config.visualizerMode);
    }
    if (has('lyricWordMode') && typeof config.lyricWordMode === 'string') {
        store.handleSetLyricWordMode(config.lyricWordMode);
    }
    if (has('lyricFontPresetId') && typeof config.lyricFontPresetId === 'string') {
        store.handleSetLyricFontPresetId(config.lyricFontPresetId);
    }
    if (has('lyricEffectPackId') && typeof config.lyricEffectPackId === 'string') {
        store.handleSetLyricEffectPackId(config.lyricEffectPackId);
    }
    if (has('visualEffectIntensity') && typeof config.visualEffectIntensity === 'string') {
        store.handleSetVisualEffectIntensity(config.visualEffectIntensity);
    }
    if (has('visualizerBackgroundMode') && typeof config.visualizerBackgroundMode === 'string') {
        store.handleSetVisualizerBackgroundMode(config.visualizerBackgroundMode);
    }
    if (has('backgroundOpacity')) {
        store.handleSetBackgroundOpacity(Number(config.backgroundOpacity));
    }
    if (has('visualizerOpacity')) {
        store.handleSetVisualizerOpacity(Number(config.visualizerOpacity));
    }
    if (has('hidePlayerTranslationSubtitle')) {
        store.handleToggleHidePlayerTranslationSubtitle(Boolean(config.hidePlayerTranslationSubtitle));
    }
    if (has('showSubtitleTranslation')) {
        store.handleToggleShowSubtitleTranslation(Boolean(config.showSubtitleTranslation));
    }
    if (has('subtitleContentMode')
        && (config.subtitleContentMode === 'translation'
            || config.subtitleContentMode === 'romanization'
            || config.subtitleContentMode === 'none')) {
        store.handleSetSubtitleContentMode(config.subtitleContentMode);
    }
    if (has('showHarmonySubtitle')) {
        store.handleToggleShowHarmonySubtitle(Boolean(config.showHarmonySubtitle));
    }
    if (has('harmonySubtitleBackground')) {
        store.handleToggleHarmonySubtitleBackground(Boolean(config.harmonySubtitleBackground));
    }
    if (has('playbackPresentation')
        && (config.playbackPresentation === 'speaker' || config.playbackPresentation === 'default')) {
        store.handleSetPlaybackPresentation(config.playbackPresentation);
    }
    if (has('subtitleFontScale')) {
        store.handleSetSubtitleFontScale(Number(config.subtitleFontScale));
    }
    if (has('subtitleOverlayBackground')) {
        store.handleToggleSubtitleOverlayBackground(Boolean(config.subtitleOverlayBackground));
    }
    if (has('subtitleFontInheritsLyrics')) {
        store.handleSetSubtitleFontInheritsLyrics(Boolean(config.subtitleFontInheritsLyrics));
    }
    if (has('subtitleFontStyle') && config.subtitleFontStyle) {
        store.handleSetSubtitleFontStyle(String(config.subtitleFontStyle));
    }
    if (has('subtitleFontFamily')) {
        store.handleSetSubtitleFontFamily(
            typeof config.subtitleFontFamily === 'string' ? config.subtitleFontFamily : null,
        );
    }
    if (has('lyricsFontStyle') && config.lyricsFontStyle) {
        store.handleSetLyricsFontStyle(String(config.lyricsFontStyle));
    }
    if (has('lyricsFontScale')) {
        store.handleSetLyricsFontScale(Number(config.lyricsFontScale));
    }
    const lyricColorPresetId = typeof config.lyricColorPresetId === 'string'
        ? normalizeLyricColorPresetId(config.lyricColorPresetId)
        : null;
    if (has('lyricColorPresetId') && lyricColorPresetId && getLyricColorPresetById(lyricColorPresetId)) {
        saveStoredLyricColorPresetId(lyricColorPresetId);
    } else if (has('lyricBodyColor') && typeof config.lyricBodyColor === 'string') {
        saveStoredLyricBodyColor(config.lyricBodyColor);
    }

    const applyTuning = (
        key: string,
        setter: (patch: Record<string, unknown>) => void,
    ) => {
        if (has(key) && config[key] && typeof config[key] === 'object') {
            setter(config[key] as Record<string, unknown>);
        }
    };

    applyTuning('classicTuning', store.handleSetClassicTuning);
    applyTuning('cadenzaTuning', store.handleSetCadenzaTuning);
    applyTuning('partitaTuning', store.handleSetPartitaTuning);
    applyTuning('fumeTuning', store.handleSetFumeTuning);
    applyTuning('claddaghTuning', store.handleSetCladdaghTuning);
    applyTuning('cappellaTuning', store.handleSetCappellaTuning);
    applyTuning('tiltTuning', store.handleSetTiltTuning);
    applyTuning('pendoloTuning', store.handleSetPendoloTuning);
    applyTuning('monetBackgroundTuning', store.handleSetMonetBackgroundTuning);
    applyTuning('latentBackgroundTuning', store.handleSetLatentBackgroundTuning);
    applyTuning('nomandBackgroundTuning', store.handleSetNomandBackgroundTuning);
    applyTuning('interactive3dSceneTuning', store.handleSetInteractive3dSceneTuning);
    applyTuning('monetTuning', store.handleSetMonetTuning);

    let mergedUrlList: UrlBackgroundItem[] | undefined;
    if (has('urlBackgroundList') && Array.isArray(config.urlBackgroundList)) {
        mergedUrlList = mergeUrlBackgroundList(store.urlBackgroundList, config.urlBackgroundList);
        store.handleSetUrlBackgroundList(mergedUrlList);
    }
    if (has('urlBackgroundSelectedId') && config.urlBackgroundSelectedId) {
        const list = mergedUrlList ?? store.urlBackgroundList;
        if (list.some(item => item.id === config.urlBackgroundSelectedId)) {
            store.handleSetUrlBackgroundSelectedId(String(config.urlBackgroundSelectedId));
        }
    }

    if (has('songThemeAutoSwitchEnabled')) {
        onToggleSongThemeAutoSwitch(Boolean(config.songThemeAutoSwitchEnabled));
    }
    if (has('songThemeAutoGenerateEnabled')) {
        onToggleSongThemeAutoGenerate(Boolean(config.songThemeAutoGenerateEnabled));
    }
    if (has('enableSmartAtmosphere')) {
        store.handleToggleEnableSmartAtmosphere(Boolean(config.enableSmartAtmosphere));
    }
    if (has('performanceMode')) {
        setPerformanceMode(parsePerformanceMode(String(config.performanceMode)));
    }
    if (has('ambientVisualEnabled')) {
        setAmbientVisualEnabled(Boolean(config.ambientVisualEnabled));
    }
    if (has('magneticPullEnabled')) {
        setMagneticPullEnabled(Boolean(config.magneticPullEnabled));
    }
    if (has('emotionScrambleEnabled')) {
        setEmotionScrambleEnabled(Boolean(config.emotionScrambleEnabled));
    }
    if (has('emotionBeatPulseEnabled')) {
        setEmotionBeatPulseEnabled(Boolean(config.emotionBeatPulseEnabled));
    }
    if (has('stageTrackPillMode')) {
        store.handleSetStageTrackPillMode(parseStageTrackPillMode(config.stageTrackPillMode));
    }
    if (has('stageTrackPillTimeoutSec')) {
        store.handleSetStageTrackPillTimeoutSec(clampStageTrackPillTimeoutSec(config.stageTrackPillTimeoutSec));
    }
    if (has('stageTrackPillOnHome')) {
        store.handleToggleStageTrackPillOnHome(Boolean(config.stageTrackPillOnHome));
    }
}
