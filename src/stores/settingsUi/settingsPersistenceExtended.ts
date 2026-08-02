import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    DEFAULT_LATENT_BACKGROUND_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_MONET_TUNING,
    type GridViewCardLayout,
    type Interactive3dSceneTuning,
    type LatentBackgroundColorSource,
    type LatentBackgroundDisplayMode,
    type LatentBackgroundTuning,
    type LyricProviderSource,
    type LyricWordMode,
    type MonetBackgroundTuning,
    type MonetTuning,
    type QueueAddBehavior,
    type StoredCustomLyricsFont,
    type Theme,
    type UrlBackgroundItem,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../../types';
import { resolveStoredInteractive3dSceneTuning } from '../../components/visualizer/geometric/interactive3dSceneRegistry';
import {
    DEFAULT_LYRIC_WORD_MODE,
    LYRIC_WORD_MODE_STORAGE_KEY,
    parseLyricWordMode,
} from '../../utils/lyrics/lyricWordMode';
import {
    DEFAULT_LYRIC_FONT_PRESET_ID,
    LYRIC_FONT_PRESET_STORAGE_KEY,
    parseLyricFontPresetId,
} from '../../utils/lyricFontPresets';
import {
    DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY,
    LYRIC_VISUAL_EFFECT_INTENSITY_STORAGE_KEY,
    parseLyricVisualEffectIntensity,
    type LyricVisualEffectIntensity,
} from '../../utils/lyricVisualEffects';
import {
    DEFAULT_LYRIC_EFFECT_PACK_ID,
    LYRIC_EFFECT_PACK_STORAGE_KEY,
    parseLyricEffectPackId,
    type LyricEffectPackId,
} from '../../utils/lyricEffectPacks';
import {
    clampLyricsFontScale,
    DEFAULT_LYRICS_FONT_SCALE,
} from '../../utils/lyrics/lyricsFontScaleMath';
import {
    readGpuUnstableFlag,
    readInteractive3dOptIn,
    resolveElectronSafeVisualizerBackgroundMode,
    writeInteractive3dOptIn,
} from '../../utils/performance/electronInteractive3dGuardMath';
import { sanitizeUrlBackgroundList } from '../../utils/urlBackground';
import type { LocalBeatAnalysisMode } from '../../utils/atmosphere/localBeatMapCache';
import {
    DEFAULT_LOCAL_BEAT_ANALYSIS_PROMPT_POLICY,
    type LocalBeatAnalysisPromptPolicy,
} from '../../utils/atmosphere/localBeatAnalysisPolicy';
import {
    ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY,
    INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY,
    getStoredBoolean,
    setStoredBoolean,
    SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY,
    resolveMonetBackgroundSource,
    resolveMonetBackgroundLayout,
    resolveMonetBackgroundWashColorMode,
    clampMonetBackgroundBlur,
    clampUnitInterval,
    clampMonetBackgroundSaturation,
    clampMonetBackgroundOffsetX,
    clampMonetFontScale,
    normalizeHexColor,
    resolveMonetPortraitSource,
    readStoredSubtitleContentMode,
} from './settingsPersistenceCore';

// src/stores/settingsUi/settingsPersistenceExtended.ts
// Background mode, monet/latent, lyrics fonts, home/playback preference readers.

export const VISUALIZER_BACKGROUND_MODES: VisualizerBackgroundMode[] = [
    'common',
    'interactive3d',
    'monet',
    'url',
    'sora',
    'latent',
    'turntable',
];

export const resolveLatentDisplayMode = (value: LatentBackgroundDisplayMode | undefined): LatentBackgroundDisplayMode => (
    value === 'dithering' || value === 'mesh' || value === 'both'
        ? value
        : DEFAULT_LATENT_BACKGROUND_TUNING.displayMode
);

export const resolveLatentColorSource = (value: LatentBackgroundColorSource | undefined): LatentBackgroundColorSource => (
    value === 'cover-only' ? 'cover-only' : DEFAULT_LATENT_BACKGROUND_TUNING.colorSource
);

export const clampLatentUnit = (value: number | undefined, fallback: number, min = 0, max = 2) => {
    const next = Number.isFinite(value) ? Number(value) : fallback;
    return Math.min(max, Math.max(min, next));
};

export const resolveStoredLatentBackgroundTuning = (
    parsed: Partial<LatentBackgroundTuning>,
): LatentBackgroundTuning => ({
    displayMode: resolveLatentDisplayMode(parsed.displayMode),
    colorSource: resolveLatentColorSource(parsed.colorSource),
    dynamicOnlyInPlayer: parsed.dynamicOnlyInPlayer ?? DEFAULT_LATENT_BACKGROUND_TUNING.dynamicOnlyInPlayer,
    enhancedBeatResponse: parsed.enhancedBeatResponse ?? DEFAULT_LATENT_BACKGROUND_TUNING.enhancedBeatResponse,
    ditheringSpeed: clampLatentUnit(parsed.ditheringSpeed, DEFAULT_LATENT_BACKGROUND_TUNING.ditheringSpeed),
    ditheringAudioSpeed: clampLatentUnit(parsed.ditheringAudioSpeed, DEFAULT_LATENT_BACKGROUND_TUNING.ditheringAudioSpeed),
    ditheringSize: clampLatentUnit(parsed.ditheringSize, DEFAULT_LATENT_BACKGROUND_TUNING.ditheringSize, 0.5, 8),
    ditheringOpacity: clampLatentUnit(parsed.ditheringOpacity, DEFAULT_LATENT_BACKGROUND_TUNING.ditheringOpacity, 0, 1),
    meshSpeed: clampLatentUnit(parsed.meshSpeed, DEFAULT_LATENT_BACKGROUND_TUNING.meshSpeed),
    meshAudioSpeed: clampLatentUnit(parsed.meshAudioSpeed, DEFAULT_LATENT_BACKGROUND_TUNING.meshAudioSpeed),
    meshDistortion: clampLatentUnit(parsed.meshDistortion, DEFAULT_LATENT_BACKGROUND_TUNING.meshDistortion),
    meshSwirl: clampLatentUnit(parsed.meshSwirl, DEFAULT_LATENT_BACKGROUND_TUNING.meshSwirl, 0, 1),
    overlayEnabled: parsed.overlayEnabled ?? DEFAULT_LATENT_BACKGROUND_TUNING.overlayEnabled,
    overlayOpacity: clampLatentUnit(parsed.overlayOpacity, DEFAULT_LATENT_BACKGROUND_TUNING.overlayOpacity, 0, 1),
});

export const readStoredLatentBackgroundTuning = (): LatentBackgroundTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_LATENT_BACKGROUND_TUNING;
    }
    try {
        const saved = localStorage.getItem('latent_background_tuning');
        if (!saved) return DEFAULT_LATENT_BACKGROUND_TUNING;
        return resolveStoredLatentBackgroundTuning(JSON.parse(saved) as Partial<LatentBackgroundTuning>);
    } catch {
        return DEFAULT_LATENT_BACKGROUND_TUNING;
    }
};

export const readStoredVisualizerBackgroundMode = (): VisualizerBackgroundMode | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const saved = localStorage.getItem('visualizer_background_mode');
    if (saved && VISUALIZER_BACKGROUND_MODES.includes(saved as VisualizerBackgroundMode)) {
        return saved as VisualizerBackgroundMode;
    }

    if (getStoredBoolean(ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY, false)) {
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
        localStorage.removeItem(ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY);
        return 'interactive3d';
    }

    return null;
};

export const readStoredUrlBackgroundList = (): UrlBackgroundItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem('url_background_list');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return sanitizeUrlBackgroundList(parsed);
    } catch {
        return [];
    }
};

export const readStoredUrlBackgroundSelectedId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('url_background_selected_id') || null;
};

/** Default player background when nothing is stored. Independent of lyric visualizer mode. */
export const DEFAULT_VISUALIZER_BACKGROUND_MODE: VisualizerBackgroundMode = 'common';

/**
 * Resolve player background mode.
 * Lyric style (visualizerMode) must not change background — keep an explicit stored mode.
 * `visualizerMode` is accepted for call-site compatibility only.
 */
export const resolveVisualizerBackgroundMode = (
    storedMode: VisualizerBackgroundMode | null | undefined,
    _visualizerMode?: VisualizerMode,
): VisualizerBackgroundMode => storedMode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;

export const bootstrapVisualizerBackgroundMode = (): VisualizerBackgroundMode => {
    const storedMode = readStoredVisualizerBackgroundMode();
    let resolvedMode = resolveVisualizerBackgroundMode(storedMode);

    if (typeof window !== 'undefined') {
        const isElectron = Boolean((window as Window & { electron?: unknown }).electron);
        const safeMode = resolveElectronSafeVisualizerBackgroundMode({
            mode: resolvedMode,
            isElectron,
            devicePixelRatio: window.devicePixelRatio || 1,
            gpuUnstable: readGpuUnstableFlag(localStorage),
            interactive3dOptIn: readInteractive3dOptIn(localStorage),
        });
        if (safeMode !== resolvedMode) {
            resolvedMode = safeMode;
            localStorage.setItem('visualizer_background_mode', resolvedMode);
            writeInteractive3dOptIn(localStorage, false);
        } else if (!storedMode) {
            localStorage.setItem('visualizer_background_mode', resolvedMode);
        }
        setStoredBoolean(
            ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY,
            resolvedMode === 'interactive3d',
        );
    }

    return resolvedMode;
};

export const bootVisualizerBackgroundMode = bootstrapVisualizerBackgroundMode();

export type StoredMonetBackgroundTuningInput = Partial<MonetBackgroundTuning> & {
    backgroundCropMode?: unknown;
    coverPaneRatio?: unknown;
    lyricsFocusScale?: unknown;
};

export const resolveStoredMonetBackgroundTuning = (parsed: StoredMonetBackgroundTuningInput): MonetBackgroundTuning => ({
    backgroundSource: resolveMonetBackgroundSource(parsed.backgroundSource),
    backgroundLayout: resolveMonetBackgroundLayout(parsed.backgroundLayout),
    backgroundBlurPx: clampMonetBackgroundBlur(
        parsed.backgroundBlurPx ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundBlurPx,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundBlurPx,
    ),
    backgroundOverlayOpacity: clampUnitInterval(
        parsed.backgroundOverlayOpacity ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundOverlayOpacity,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundOverlayOpacity,
    ),
    backgroundGrayscale: clampUnitInterval(
        parsed.backgroundGrayscale ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundGrayscale,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundGrayscale,
    ),
    backgroundSaturation: clampMonetBackgroundSaturation(
        parsed.backgroundSaturation ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundSaturation,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundSaturation,
    ),
    backgroundWash: clampUnitInterval(
        parsed.backgroundWash ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundWash,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundWash,
    ),
    backgroundHalfPaneOffsetX: clampMonetBackgroundOffsetX(
        parsed.backgroundHalfPaneOffsetX ?? DEFAULT_MONET_BACKGROUND_TUNING.backgroundHalfPaneOffsetX,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundHalfPaneOffsetX,
    ),
    backgroundWashColorMode: resolveMonetBackgroundWashColorMode(parsed.backgroundWashColorMode),
    backgroundWashCustomColor: normalizeHexColor(
        parsed.backgroundWashCustomColor,
        DEFAULT_MONET_BACKGROUND_TUNING.backgroundWashCustomColor,
    ),
});

export type StoredMonetTuningInput = Partial<MonetTuning> & StoredMonetBackgroundTuningInput;
export const resolveStoredMonetTuning = (parsed: StoredMonetTuningInput): MonetTuning => ({
    keywordColoringEnabled: parsed.keywordColoringEnabled ?? DEFAULT_MONET_TUNING.keywordColoringEnabled,
    showDescription: parsed.showDescription ?? DEFAULT_MONET_TUNING.showDescription,
    audioStyle: parsed.audioStyle === 'line' ? 'line' : DEFAULT_MONET_TUNING.audioStyle,
    fontScale: clampMonetFontScale(
        parsed.fontScale ?? DEFAULT_MONET_TUNING.fontScale,
        DEFAULT_MONET_TUNING.fontScale,
    ),
    portraitSource: resolveMonetPortraitSource(parsed.portraitSource),
    portraitOffsetX: typeof parsed.portraitOffsetX === 'number'
        ? Math.min(0, Math.max(-150, parsed.portraitOffsetX))
        : (DEFAULT_MONET_TUNING.portraitOffsetX ?? 0),
    portraitStyle: parsed.portraitStyle === 'rectangular' ? 'rectangular' : DEFAULT_MONET_TUNING.portraitStyle,
    showPortraitDragHanger: parsed.showPortraitDragHanger ?? DEFAULT_MONET_TUNING.showPortraitDragHanger,
});
export const readStoredMonetBackgroundTuning = (): MonetBackgroundTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_MONET_BACKGROUND_TUNING;
    }

    const saved = localStorage.getItem('monet_background_tuning') ?? localStorage.getItem('monet_tuning');
    if (!saved) return DEFAULT_MONET_BACKGROUND_TUNING;

    try {
        const parsed = JSON.parse(saved) as StoredMonetBackgroundTuningInput;
        return resolveStoredMonetBackgroundTuning(parsed);
    } catch {
        return DEFAULT_MONET_BACKGROUND_TUNING;
    }
};

export const readStoredInteractive3dSceneTuning = (): Interactive3dSceneTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_INTERACTIVE3D_SCENE_TUNING;
    }

    const saved = localStorage.getItem(INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY);
    if (!saved) return DEFAULT_INTERACTIVE3D_SCENE_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<Interactive3dSceneTuning>;
        return resolveStoredInteractive3dSceneTuning(parsed);
    } catch {
        return DEFAULT_INTERACTIVE3D_SCENE_TUNING;
    }
};

export const readStoredMonetTuning = (): MonetTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_MONET_TUNING;
    }

    const saved = localStorage.getItem('monet_tuning');
    if (!saved) return DEFAULT_MONET_TUNING;

    try {
        const parsed = JSON.parse(saved) as StoredMonetTuningInput;
        return resolveStoredMonetTuning(parsed);
    } catch {
        return DEFAULT_MONET_TUNING;
    }
};

export const readStoredLyricsFontStyle = (): Theme['fontStyle'] => {
    if (typeof window === 'undefined') {
        return 'sans';
    }

    const saved = localStorage.getItem('lyrics_font_style');
    return saved === 'serif' || saved === 'mono' ? saved : 'sans';
};

export const readStoredLyricWordMode = (): LyricWordMode => {
    if (typeof window === 'undefined') {
        return DEFAULT_LYRIC_WORD_MODE;
    }

    return parseLyricWordMode(localStorage.getItem(LYRIC_WORD_MODE_STORAGE_KEY));
};

export const readStoredLyricFontPresetId = (): string => {
    if (typeof window === 'undefined') {
        return DEFAULT_LYRIC_FONT_PRESET_ID;
    }

    return parseLyricFontPresetId(localStorage.getItem(LYRIC_FONT_PRESET_STORAGE_KEY));
};

export const readStoredVisualEffectIntensity = (): LyricVisualEffectIntensity => {
    if (typeof window === 'undefined') {
        return DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY;
    }

    return parseLyricVisualEffectIntensity(localStorage.getItem(LYRIC_VISUAL_EFFECT_INTENSITY_STORAGE_KEY));
};

export const readStoredLyricEffectPackId = (): LyricEffectPackId => {
    if (typeof window === 'undefined') {
        return DEFAULT_LYRIC_EFFECT_PACK_ID;
    }
    return parseLyricEffectPackId(localStorage.getItem(LYRIC_EFFECT_PACK_STORAGE_KEY));
};

export const readStoredLyricsFontScale = (): number => {
    if (typeof window === 'undefined') {
        return DEFAULT_LYRICS_FONT_SCALE;
    }

    const saved = localStorage.getItem('lyrics_font_scale');
    if (!saved) return DEFAULT_LYRICS_FONT_SCALE;

    const parsed = parseFloat(saved);
    return clampLyricsFontScale(parsed, DEFAULT_LYRICS_FONT_SCALE);
};

export const resolveStoredCustomLyricsFont = (parsed: Partial<StoredCustomLyricsFont>): StoredCustomLyricsFont | null => {
    const family = parsed.family?.trim();
    if (!family) return null;

    const source = parsed.source === 'uploaded' ? 'uploaded' : 'system';
    const label = parsed.label?.trim() || family;

    if (source === 'uploaded') {
        const fontId = parsed.fontId?.trim();
        if (!fontId) return null;

        return {
            source,
            family,
            label,
            fontId,
        };
    }

    return {
        source,
        family,
        label,
    };
};

export const readStoredCustomLyricsFont = (): StoredCustomLyricsFont | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const saved = localStorage.getItem('lyrics_custom_font');
    if (!saved) return null;

    try {
        const parsed = JSON.parse(saved) as Partial<StoredCustomLyricsFont>;
        return resolveStoredCustomLyricsFont(parsed);
    } catch {
        return null;
    }
};

export const readStoredLyricFilterPattern = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('lyrics_filter_pattern')?.trim() || '';
};

export const readStoredLoopMode = (): 'off' | 'all' | 'one' => {
    if (typeof window === 'undefined') {
        return 'off';
    }

    const saved = localStorage.getItem('player_loop_mode');
    return saved === 'all' || saved === 'one' ? saved : 'off';
};

export const readStoredGridViewCardLayout = (): GridViewCardLayout => {
    if (typeof window === 'undefined') {
        return 'neat';
    }

    const saved = localStorage.getItem('grid_view_card_layout');
    return saved === 'casual' ? 'casual' : 'neat';
};

export const readStoredPlayerLyricsVisible = (): boolean => {
    if (typeof window === 'undefined') {
        return true;
    }

    return localStorage.getItem('player_lyrics_visible') !== 'false';
};

export const readStoredQueueAddBehavior = (): QueueAddBehavior => {
    if (typeof window === 'undefined') {
        return 'append';
    }

    const saved = localStorage.getItem('queue_add_behavior');
    return saved === 'next' ? 'next' : 'append';
};

export const LOCAL_BEAT_ANALYSIS_MODE_STORAGE_KEY = 'local_beat_analysis_mode';
export const LOCAL_BEAT_ANALYSIS_PROMPT_STORAGE_KEY = 'local_beat_analysis_prompt';

export const readStoredLocalBeatAnalysisMode = (): LocalBeatAnalysisMode => {
    if (typeof window === 'undefined') {
        return 'mr';
    }

    return localStorage.getItem(LOCAL_BEAT_ANALYSIS_MODE_STORAGE_KEY) === 'dj' ? 'dj' : 'mr';
};

export const readStoredLocalBeatAnalysisPromptPolicy = (): LocalBeatAnalysisPromptPolicy => {
    if (typeof window === 'undefined') {
        return DEFAULT_LOCAL_BEAT_ANALYSIS_PROMPT_POLICY;
    }
    return localStorage.getItem(LOCAL_BEAT_ANALYSIS_PROMPT_STORAGE_KEY) === 'ask' ? 'ask' : 'auto';
};

export const readStoredAudioOutputDeviceId = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('audio_output_device_id') ?? '';
};

export const readStoredHomeLayoutStyle = (): 'carousel' | 'grid' => {
    if (typeof window === 'undefined') {
        return 'grid';
    }

    const saved = localStorage.getItem('home_layout_style');
    if (saved === 'desktop') return 'grid';
    return saved === 'carousel' ? 'carousel' : 'grid';
};

export const readStoredPreferredAlternativeLyricSource = (): LyricProviderSource => {
    if (typeof window === 'undefined') return 'netease';
    const saved = localStorage.getItem('preferred_alternative_lyric_source');
    return saved === 'qq' || saved === 'kugou' || saved === 'amll' ? saved : 'netease';
};

/**
 * Reads the stored card style for the Grid3D desktop home view from localStorage.
 * Returns 'image' (pure cover cover) or 'card' (Polaroid style with details).
 */
export const readStoredGrid3dCardStyle = (): 'image' | 'card' => {
    if (typeof window === 'undefined') {
        return 'card';
    }

    const saved = localStorage.getItem('grid3d_card_style');
    return saved === 'image' ? 'image' : 'card';
};

export const readStoredVolume = () => {
    if (typeof window === 'undefined') {
        return 1;
    }

    const saved = localStorage.getItem('player_volume');
    const parsed = saved !== null ? parseFloat(saved) : 1;
    return Number.isFinite(parsed) ? parsed : 1;
};

