import {
    DEFAULT_CADENZA_TUNING,
    DEFAULT_CAPPELLA_TUNING,
    DEFAULT_CLASSIC_TUNING,
    DEFAULT_CLADDAGH_TUNING,
    DEFAULT_FUME_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_PARTITA_TUNING,
    DEFAULT_PENDOLO_TUNING,
    DEFAULT_TILT_TUNING,
    DEFAULT_MONET_TUNING,
    type CadenzaTuning,
    type CappellaAvatarSource,
    type CappellaTuning,
    type ClassicTuning,
    type CladdaghTuning,
    type FumeTuning,
    type MonetBackgroundLayout,
    type MonetBackgroundSource,
    type MonetBackgroundWashColorMode,
    type MonetPortraitSource,
    type PartitaTuning,
    type PendoloTuning,
    type PlaybackPresentation,
    type Theme,
    type TiltTuning,
    type VisualizerFrameRate,
    type VisualizerMode,
    type SubtitleContentMode,
} from '../../types';
import { DEFAULT_VISUALIZER_MODE, isBuiltinVisualizerMode } from '../../types/visualizerModes';
import { LYRIC_WORD_MODE_STORAGE_KEY } from '../../utils/lyrics/lyricWordMode';
import {
    readGpuUnstableFlag,
    readInteractive3dOptIn,
    resolveElectronSafeVisualizerMode,
} from '../../utils/performance/electronInteractive3dGuardMath';
import { resolveDefaultDisableHomeDynamicBackground } from '../../utils/playback/playbackLoadPriorityMath';
import {
    ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY as ENABLE_3D_BG_KEY,
} from '../visualizerBackgroundModeHandlers';
import { parseVisualizerFrameRate, VISUALIZER_FRAME_RATE_STORAGE_KEY } from '../../utils/frameRateLimiter';
import type { AudioQuality } from './types';

// src/stores/settingsUi/settingsPersistenceCore.ts
// Storage keys and classic→pendolo/monet clamp helpers.

export const CACHE_SIZE_KEY = 'folia_cache_size';
export const ENABLE_MEDIA_CACHE_KEY = 'folia_enable_media_cache';
export const AUTO_RESYNC_DOWNLOAD_FOLDER_KEY = 'folia_auto_resync_download_folder';
export const LAST_SEEN_GUIDE_VERSION_STORAGE_KEY = 'folia_last_seen_guide_version';
export const ONBOARDING_COMPLETED_STORAGE_KEY = 'lyra_onboarding_completed';

export const readOnboardingCompleted = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    if (localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) === 'true') {
        return true;
    }
    // Existing installs already used the guide; do not force first-run onboarding.
    return Boolean(localStorage.getItem(LAST_SEEN_GUIDE_VERSION_STORAGE_KEY));
};

export const MINIMIZE_TO_TRAY_STORAGE_KEY = 'minimize_to_tray';
export const HIDE_TASKBAR_ICON_STORAGE_KEY = 'hide_taskbar_icon';
export const OPEN_PLAYER_ON_LAUNCH_STORAGE_KEY = 'open_player_on_launch';
export const AUTO_PLAY_ON_LAUNCH_STORAGE_KEY = 'auto_play_on_launch';
export const SUBTITLE_OVERLAY_OPACITY_STORAGE_KEY = 'subtitle_overlay_opacity';
export const SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY = 'show_subtitle_translation';
export const SHOW_HARMONY_SUBTITLE_STORAGE_KEY = 'show_harmony_subtitle';
export const HARMONY_SUBTITLE_BACKGROUND_STORAGE_KEY = 'harmony_subtitle_background';
export const SUBTITLE_CONTENT_MODE_STORAGE_KEY = 'subtitle_content_mode';
export const SUBTITLE_FONT_SCALE_STORAGE_KEY = 'subtitle_font_scale';

export const readStoredSubtitleContentMode = (): SubtitleContentMode => {
    if (typeof window === 'undefined') {
        return 'translation';
    }
    const saved = localStorage.getItem(SUBTITLE_CONTENT_MODE_STORAGE_KEY);
    if (saved === 'translation' || saved === 'romanization' || saved === 'none') {
        return saved;
    }
    return getStoredBoolean(SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY, true) ? 'translation' : 'none';
};

export const readStoredSubtitleFontScale = () => {
    if (typeof window === 'undefined') {
        return 1;
    }
    const saved = localStorage.getItem(SUBTITLE_FONT_SCALE_STORAGE_KEY);
    const parsed = saved !== null ? parseFloat(saved) : 1;
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(1.6, Math.max(0.7, parsed));
};
export const SUBTITLE_OVERLAY_BACKGROUND_STORAGE_KEY = 'subtitle_overlay_background';
export const SUBTITLE_FONT_INHERITS_LYRICS_STORAGE_KEY = 'subtitle_font_inherits_lyrics';
export const SUBTITLE_FONT_STYLE_STORAGE_KEY = 'subtitle_font_style';
export const SUBTITLE_FONT_FAMILY_STORAGE_KEY = 'subtitle_font_family';
export const VISUALIZER_OPACITY_STORAGE_KEY = 'visualizer_opacity';
export const ENABLE_SMART_ATMOSPHERE_STORAGE_KEY = 'enable_smart_atmosphere';
export const PLAYBACK_PRESENTATION_STORAGE_KEY = 'playback_presentation';

export const parsePlaybackPresentation = (raw: string | null): PlaybackPresentation => (
    raw === 'speaker' ? 'speaker' : 'default'
);
export const ENABLE_BILIBILI_VIDEO_BACKGROUND_STORAGE_KEY = 'enable_bilibili_video_background';
export const INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY = 'interactive_3d_scene_tuning';
export { ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY } from '../visualizerBackgroundModeHandlers';
const ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY = ENABLE_3D_BG_KEY;

export const DEFAULT_DAYLIGHT_PREFERENCE = false;

export const getStoredBoolean = (key: string, fallback: boolean) => {
    if (typeof window === 'undefined') {
        return fallback;
    }

    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : fallback;
};

export const readDefaultDaylightPreference = (): boolean => (
    getStoredBoolean('default_theme_daylight', DEFAULT_DAYLIGHT_PREFERENCE)
);

export const setStoredBoolean = (key: string, value: boolean) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, String(value));
    }
};

export const readStoredDisableHomeDynamicBackground = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const saved = localStorage.getItem('disable_home_dynamic_background');
    if (saved !== null) {
        return saved === 'true';
    }

    const legacySaved = localStorage.getItem('enable_home_dynamic_background');
    if (legacySaved !== null) {
        return legacySaved !== 'true';
    }

    // Electron: pause heavy home backgrounds by default so idle GPU doesn't fight playback.
    return resolveDefaultDisableHomeDynamicBackground({
        isElectron: Boolean((window as Window & { electron?: unknown }).electron),
        stored: null,
    });
};

export const readStoredAudioQuality = (): AudioQuality => {
    if (typeof window === 'undefined') {
        return 'exhigh';
    }

    const saved = localStorage.getItem('default_audio_quality');
    return saved === 'lossless' || saved === 'hires' ? saved : 'exhigh';
};

export const readStoredBackgroundOpacity = () => {
    if (typeof window === 'undefined') {
        return 0.75;
    }

    const saved = localStorage.getItem('background_opacity');
    const parsed = saved ? parseFloat(saved) : 0.75;
    return Number.isFinite(parsed) ? parsed : 0.75;
};

export const readStoredSubtitleOverlayOpacity = () => {
    if (typeof window === 'undefined') {
        return 0.6;
    }

    const saved = localStorage.getItem(SUBTITLE_OVERLAY_OPACITY_STORAGE_KEY);
    const parsed = saved ? parseFloat(saved) : 0.6;
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0.2, parsed)) : 0.6;
};

export const readStoredSubtitleFontStyle = (): Theme['fontStyle'] => {
    if (typeof window === 'undefined') {
        return 'sans';
    }
    const saved = localStorage.getItem(SUBTITLE_FONT_STYLE_STORAGE_KEY);
    return saved === 'serif' || saved === 'mono' ? saved : 'sans';
};

export const readStoredSubtitleFontFamily = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(SUBTITLE_FONT_FAMILY_STORAGE_KEY)?.trim() || null;
};

export const readStoredVisualizerOpacity = () => {
    if (typeof window === 'undefined') {
        return 1;
    }

    const saved = localStorage.getItem(VISUALIZER_OPACITY_STORAGE_KEY);
    const parsed = saved ? parseFloat(saved) : 1;
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0.2, parsed)) : 1;
};

export const readStoredVisualizerMode = (): VisualizerMode => {
    if (typeof window === 'undefined') {
        return DEFAULT_VISUALIZER_MODE;
    }

    const saved = localStorage.getItem('visualizer_mode');
    // Legacy: karaoke used to be a visualizer mode; migrate to lyric word policy.
    if (saved === 'karaoke') {
        if (!localStorage.getItem(LYRIC_WORD_MODE_STORAGE_KEY)) {
            localStorage.setItem(LYRIC_WORD_MODE_STORAGE_KEY, 'karaoke');
        }
        localStorage.setItem('visualizer_mode', DEFAULT_VISUALIZER_MODE);
        return DEFAULT_VISUALIZER_MODE;
    }
    if (saved === 'cadenza' || saved === 'cadenze') {
        return 'cadenza';
    }

    let resolvedMode: VisualizerMode = isBuiltinVisualizerMode(saved) ? saved : DEFAULT_VISUALIZER_MODE;
    const isElectron = Boolean((window as Window & { electron?: unknown }).electron);
    const safeMode = resolveElectronSafeVisualizerMode({
        mode: resolvedMode,
        isElectron,
        gpuUnstable: readGpuUnstableFlag(localStorage),
    });
    if (safeMode !== resolvedMode) {
        resolvedMode = safeMode;
        localStorage.setItem('visualizer_mode', resolvedMode);
    }
    return resolvedMode;
};

export const readStoredVisualizerFrameRate = (): VisualizerFrameRate => {
    if (typeof window === 'undefined') {
        return 'off';
    }

    return parseVisualizerFrameRate(localStorage.getItem(VISUALIZER_FRAME_RATE_STORAGE_KEY));
};

export const clampClassicBreathingFloatMultiplier = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(2, Math.max(0, value));
};

export const clampClassicWordSpacing = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(2, Math.max(0, value));
};

export const readStoredClassicTuning = (): ClassicTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_CLASSIC_TUNING;
    }

    const saved = localStorage.getItem('classic_tuning');
    if (!saved) return DEFAULT_CLASSIC_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<ClassicTuning>;
        return {
            enableWordRotation: parsed.enableWordRotation ?? DEFAULT_CLASSIC_TUNING.enableWordRotation,
            breathingFloatMultiplier: clampClassicBreathingFloatMultiplier(
                parsed.breathingFloatMultiplier ?? DEFAULT_CLASSIC_TUNING.breathingFloatMultiplier,
                DEFAULT_CLASSIC_TUNING.breathingFloatMultiplier,
            ),
            useLegacyLayout: parsed.useLegacyLayout ?? DEFAULT_CLASSIC_TUNING.useLegacyLayout,
            wordSpacing: clampClassicWordSpacing(
                parsed.wordSpacing ?? DEFAULT_CLASSIC_TUNING.wordSpacing,
                DEFAULT_CLASSIC_TUNING.wordSpacing,
            ),
        };
    } catch {
        return DEFAULT_CLASSIC_TUNING;
    }
};

export const readStoredCadenzaTuning = (): CadenzaTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_CADENZA_TUNING;
    }

    const saved = localStorage.getItem('cadenza_tuning') ?? localStorage.getItem('cadenze_tuning');
    if (!saved) return DEFAULT_CADENZA_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<CadenzaTuning>;
        return {
            ...DEFAULT_CADENZA_TUNING,
            ...parsed,
            beamIntensity: 0,
        };
    } catch {
        return DEFAULT_CADENZA_TUNING;
    }
};

export const clampPartitaStagger = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(180, Math.max(0, value));
};

export const readStoredPartitaTuning = (): PartitaTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_PARTITA_TUNING;
    }

    const saved = localStorage.getItem('partita_tuning');
    if (!saved) return DEFAULT_PARTITA_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<PartitaTuning>;
        const rawMin = clampPartitaStagger(parsed.staggerMin ?? DEFAULT_PARTITA_TUNING.staggerMin, DEFAULT_PARTITA_TUNING.staggerMin);
        const rawMax = clampPartitaStagger(parsed.staggerMax ?? DEFAULT_PARTITA_TUNING.staggerMax, DEFAULT_PARTITA_TUNING.staggerMax);

        return {
            showGuideLines: parsed.showGuideLines ?? DEFAULT_PARTITA_TUNING.showGuideLines,
            useSemanticLayout: parsed.useSemanticLayout ?? DEFAULT_PARTITA_TUNING.useSemanticLayout,
            staggerMin: Math.min(rawMin, rawMax),
            staggerMax: Math.max(rawMin, rawMax),
        };
    } catch {
        return DEFAULT_PARTITA_TUNING;
    }
};

export const clampFumeCameraSpeed = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1.85, Math.max(0.55, value));
};

export const clampFumeGlowIntensity = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1.8, Math.max(0, value));
};

export const clampFumeBackgroundObjectOpacity = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1, Math.max(0, value));
};

export const clampFumeHeroScale = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1.32, Math.max(0.82, value));
};

export const clampFumeTextHoldRatio = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1, Math.max(0, value));
};

export const resolveFumeCameraTrackingMode = (value: FumeTuning['cameraTrackingMode'] | undefined) => (
    value === 'stepped' || value === 'smooth'
        ? value
        : DEFAULT_FUME_TUNING.cameraTrackingMode
);

export const readStoredFumeTuning = (): FumeTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_FUME_TUNING;
    }

    const saved = localStorage.getItem('fume_tuning');
    if (!saved) return DEFAULT_FUME_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<FumeTuning> & { textHoldStyle?: 'standard' | 'dimmed'; };
        const migratedTextHoldRatio = parsed.textHoldStyle === 'dimmed'
            ? 0.5
            : DEFAULT_FUME_TUNING.textHoldRatio;
        return {
            hidePrintSymbols: parsed.hidePrintSymbols ?? DEFAULT_FUME_TUNING.hidePrintSymbols,
            disableGeometricBackground: parsed.disableGeometricBackground ?? DEFAULT_FUME_TUNING.disableGeometricBackground,
            backgroundObjectOpacity: clampFumeBackgroundObjectOpacity(
                parsed.backgroundObjectOpacity ?? DEFAULT_FUME_TUNING.backgroundObjectOpacity,
                DEFAULT_FUME_TUNING.backgroundObjectOpacity,
            ),
            textHoldRatio: clampFumeTextHoldRatio(parsed.textHoldRatio ?? migratedTextHoldRatio, DEFAULT_FUME_TUNING.textHoldRatio),
            cameraTrackingMode: resolveFumeCameraTrackingMode(parsed.cameraTrackingMode),
            cameraSpeed: clampFumeCameraSpeed(parsed.cameraSpeed ?? DEFAULT_FUME_TUNING.cameraSpeed, DEFAULT_FUME_TUNING.cameraSpeed),
            glowIntensity: clampFumeGlowIntensity(parsed.glowIntensity ?? DEFAULT_FUME_TUNING.glowIntensity, DEFAULT_FUME_TUNING.glowIntensity),
            heroScale: clampFumeHeroScale(parsed.heroScale ?? DEFAULT_FUME_TUNING.heroScale, DEFAULT_FUME_TUNING.heroScale),
        };
    } catch {
        return DEFAULT_FUME_TUNING;
    }
};

export const clampCladdaghFocusScaleRatio = (val: any, fallback: number = DEFAULT_CLADDAGH_TUNING.focusScaleRatio): number => {
    const parsed = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(parsed) ? Math.min(1.5, Math.max(0.0, parsed)) : fallback;
};

export const clampCladdaghRadiusScale = (val: any, fallback: number = DEFAULT_CLADDAGH_TUNING.radiusScale): number => {
    const parsed = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(parsed) ? Math.min(1.5, Math.max(0.5, parsed)) : fallback;
};

export const clampCladdaghEllipseTiltDeg = (val: any, fallback: number = DEFAULT_CLADDAGH_TUNING.ellipseTiltDeg): number => {
    const parsed = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(parsed) ? Math.min(60, Math.max(0, parsed)) : fallback;
};

export const readStoredCladdaghTuning = (): CladdaghTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_CLADDAGH_TUNING;
    }

    const saved = localStorage.getItem('claddagh_tuning');
    if (!saved) return DEFAULT_CLADDAGH_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<CladdaghTuning>;
        // Face-on parallel is the default — roll back diagonal (45°) / vertical (90°) presets.
        const tiltSource = parsed.ellipseTiltDeg === 45 || parsed.ellipseTiltDeg === 90
            ? DEFAULT_CLADDAGH_TUNING.ellipseTiltDeg
            : parsed.ellipseTiltDeg;
        // Soften 0.9 handoff punch; lift the old soft 0.48 default for face-on depth.
        const focusSource = parsed.focusScaleRatio === 0.9 || parsed.focusScaleRatio === 0.48
            ? DEFAULT_CLADDAGH_TUNING.focusScaleRatio
            : parsed.focusScaleRatio;
        const next: CladdaghTuning = {
            focusScaleRatio: clampCladdaghFocusScaleRatio(focusSource, DEFAULT_CLADDAGH_TUNING.focusScaleRatio),
            radiusScale: clampCladdaghRadiusScale(parsed.radiusScale, DEFAULT_CLADDAGH_TUNING.radiusScale),
            ellipseTiltDeg: clampCladdaghEllipseTiltDeg(tiltSource, DEFAULT_CLADDAGH_TUNING.ellipseTiltDeg),
        };
        if (
            parsed.ellipseTiltDeg === 45
            || parsed.ellipseTiltDeg === 90
            || parsed.focusScaleRatio === 0.9
            || parsed.focusScaleRatio === 0.48
        ) {
            localStorage.setItem('claddagh_tuning', JSON.stringify(next));
        }
        return next;
    } catch {
        return DEFAULT_CLADDAGH_TUNING;
    }
};

export const resolveCappellaAvatarSource = (source: CappellaAvatarSource | undefined): CappellaAvatarSource => (
    source === 'builtin' || source === 'color' || source === 'cover' || source === 'custom'
        ? source
        : DEFAULT_CAPPELLA_TUNING.avatarSource
);

export const resolveStoredCappellaTuning = (parsed: Partial<CappellaTuning>): CappellaTuning => ({
    showEmoMessages: parsed.showEmoMessages ?? DEFAULT_CAPPELLA_TUNING.showEmoMessages,
    emojiPackSource: parsed.emojiPackSource === 'custom' ? 'custom' : 'builtin',
    avatarSource: resolveCappellaAvatarSource(parsed.avatarSource),
});

export const readStoredCappellaTuning = (): CappellaTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_CAPPELLA_TUNING;
    }

    const saved = localStorage.getItem('cappella_tuning');
    if (!saved) return DEFAULT_CAPPELLA_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<CappellaTuning>;
        return resolveStoredCappellaTuning(parsed);
    } catch {
        return DEFAULT_CAPPELLA_TUNING;
    }
};

export const readStoredTiltTuning = (): TiltTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_TILT_TUNING;
    }

    const saved = localStorage.getItem('tilt_tuning');
    if (!saved) return DEFAULT_TILT_TUNING;

    try {
        const parsed = JSON.parse(saved) as Partial<TiltTuning>;
        return {
            splitProbability: Math.min(1, Math.max(0, parsed.splitProbability ?? DEFAULT_TILT_TUNING.splitProbability)),
            tiltStyleProbability: Math.min(1, Math.max(0, parsed.tiltStyleProbability ?? DEFAULT_TILT_TUNING.tiltStyleProbability)),
            colorScheme: parsed.colorScheme ?? DEFAULT_TILT_TUNING.colorScheme,
        };
    } catch {
        return DEFAULT_TILT_TUNING;
    }
};

export const resolveStoredPendoloTuning = (parsed: Partial<PendoloTuning> = {}): PendoloTuning => ({
    arcRadius: Math.min(0.8, Math.max(0.25, parsed.arcRadius ?? DEFAULT_PENDOLO_TUNING.arcRadius)),
    arcAngleDeg: Math.min(160, Math.max(40, parsed.arcAngleDeg ?? DEFAULT_PENDOLO_TUNING.arcAngleDeg)),
    wheelCenterX: Math.min(0.4, Math.max(-0.2, parsed.wheelCenterX ?? DEFAULT_PENDOLO_TUNING.wheelCenterX)),
    wheelCenterY: Math.min(0.85, Math.max(0.15, parsed.wheelCenterY ?? DEFAULT_PENDOLO_TUNING.wheelCenterY)),
    tickSnappiness: Math.min(4, Math.max(0.5, parsed.tickSnappiness ?? DEFAULT_PENDOLO_TUNING.tickSnappiness)),
    activeScale: Math.min(1.6, Math.max(1, parsed.activeScale ?? DEFAULT_PENDOLO_TUNING.activeScale)),
    showGearDecor: parsed.showGearDecor === 'none' || parsed.showGearDecor === 'full'
        ? parsed.showGearDecor
        : DEFAULT_PENDOLO_TUNING.showGearDecor,
    showCenterGradient: parsed.showCenterGradient ?? DEFAULT_PENDOLO_TUNING.showCenterGradient,
    showCoverOnWatchFace: parsed.showCoverOnWatchFace ?? DEFAULT_PENDOLO_TUNING.showCoverOnWatchFace,
    enableLineGlow: parsed.enableLineGlow ?? DEFAULT_PENDOLO_TUNING.enableLineGlow,
});

export const readStoredPendoloTuning = (): PendoloTuning => {
    if (typeof window === 'undefined') {
        return DEFAULT_PENDOLO_TUNING;
    }

    const saved = localStorage.getItem('pendolo_tuning');
    if (!saved) return DEFAULT_PENDOLO_TUNING;

    try {
        return resolveStoredPendoloTuning(JSON.parse(saved) as Partial<PendoloTuning>);
    } catch {
        return DEFAULT_PENDOLO_TUNING;
    }
};

export const resolveMonetBackgroundSource = (value: MonetBackgroundSource | undefined): MonetBackgroundSource => (
    value === 'uploaded-global' ? 'uploaded-global' : DEFAULT_MONET_BACKGROUND_TUNING.backgroundSource
);

export const resolveMonetBackgroundLayout = (value: MonetBackgroundLayout | undefined): MonetBackgroundLayout => (
    value === 'full-overlay' || value === 'half-pane-gradient'
        ? value
        : DEFAULT_MONET_BACKGROUND_TUNING.backgroundLayout
);

export const resolveMonetBackgroundWashColorMode = (
    value: MonetBackgroundWashColorMode | undefined,
): MonetBackgroundWashColorMode => (
    value === 'custom' ? 'custom' : DEFAULT_MONET_BACKGROUND_TUNING.backgroundWashColorMode
);

export const clampMonetBackgroundBlur = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(60, Math.max(0, value));
};

export const clampUnitInterval = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1, Math.max(0, value));
};

export const clampMonetBackgroundSaturation = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(2, Math.max(0, value));
};

export const clampMonetBackgroundOffsetX = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(40, Math.max(-40, value));
};

export const clampMonetFontScale = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(1.5, Math.max(0.7, value));
};

export const normalizeHexColor = (value: unknown, fallback: string) => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmed = value.trim();
    const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    if (!/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
        return fallback;
    }

    return `#${withoutHash.toLowerCase()}`;
};

export const resolveMonetPortraitSource = (value: MonetPortraitSource | undefined): MonetPortraitSource => (
    value === 'custom' ? 'custom' : DEFAULT_MONET_TUNING.portraitSource
);

