import { startTransition } from 'react';
import type { StoreApi } from 'zustand';
import {
    DEFAULT_CADENZA_TUNING,
    DEFAULT_CAPPELLA_TUNING,
    DEFAULT_CLASSIC_TUNING,
    DEFAULT_CLADDAGH_TUNING,
    DEFAULT_FUME_TUNING,
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    DEFAULT_LATENT_BACKGROUND_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_MONET_TUNING,
    DEFAULT_PARTITA_TUNING,
    DEFAULT_PENDOLO_TUNING,
    DEFAULT_TILT_TUNING,
    type StatusMessage,
    type StoredCustomLyricsFont,
    type SubtitleContentMode,
    type UrlBackgroundItem,
} from '../../types';
import { getVisualizerRegistryEntry } from '../../components/visualizer/registry';
import {
    LYRIC_WORD_MODE_STORAGE_KEY,
    parseLyricWordMode,
} from '../../utils/lyrics/lyricWordMode';
import {
    LYRIC_FONT_PRESET_STORAGE_KEY,
    parseLyricFontPresetId,
} from '../../utils/lyricFontPresets';
import {
    LYRIC_VISUAL_EFFECT_INTENSITY_STORAGE_KEY,
    parseLyricVisualEffectIntensity,
} from '../../utils/lyricVisualEffects';
import {
    LYRIC_EFFECT_PACK_STORAGE_KEY,
    parseLyricEffectPackId,
} from '../../utils/lyricEffectPacks';
import { clampLyricsFontScale } from '../../utils/lyrics/lyricsFontScaleMath';
import {
    applyGpuCrashVisualDemote,
    applyResetVisualizerBackgroundMode,
    applyVisualizerBackgroundModeSelection,
} from '../visualizerBackgroundModeHandlers';
import { buildStoredCappellaEmojiPack, clearCustomCappellaEmojiPack, isSupportedCappellaEmojiFile, saveCustomCappellaEmojiPack } from '../../services/cappellaEmojiPack';
import { buildStoredCappellaAvatar, clearCustomCappellaAvatar, isSupportedCappellaAvatarFile, saveCustomCappellaAvatar } from '../../services/cappellaAvatarPack';
import { clearUploadedLyricsFont, uploadAndRegisterLyricsFont } from '../../services/customLyricsFont';
import { buildStoredMonetBackgroundImage, clearMonetBackgroundImage, isSupportedMonetBackgroundFile, saveMonetBackgroundImage } from '../../services/monetBackgroundImage';
import { buildStoredMonetPortraitImage, clearMonetPortraitImage, isSupportedMonetPortraitFile, saveMonetPortraitImage } from '../../services/monetPortraitImage';
import { setGlobalVisualizerFrameRate, VISUALIZER_FRAME_RATE_STORAGE_KEY } from '../../utils/frameRateLimiter';
import { sanitizeUrlBackgroundItem, sanitizeUrlBackgroundList } from '../../utils/urlBackground';
import { getLyricProviderPreferenceLabel } from '../../utils/lyrics/lyricSourceLabels';
import i18n, { applyAppLanguagePreference } from '../../i18n/config';
import type { LocalBeatAnalysisPromptPolicy } from '../../utils/atmosphere/localBeatAnalysisPolicy';
import { scheduleInteractive3dParticleYieldResume } from '../../utils/visualizer/yieldInteractive3dParticlesForModeSwitch';
import { planVisualizerModeSwitchGpuSafety } from '../../utils/visualizer/visualizerModeSwitchGpuSafety';
import type { SettingsModalInitialTab, SettingsSubviewId, SettingsUiState } from './types';
import { notify } from './notify';
import {
    AUTO_RESYNC_DOWNLOAD_FOLDER_KEY,
    ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY,
    ENABLE_BILIBILI_VIDEO_BACKGROUND_STORAGE_KEY,
    ENABLE_SMART_ATMOSPHERE_STORAGE_KEY,
    PLAYBACK_PRESENTATION_STORAGE_KEY,
    HARMONY_SUBTITLE_BACKGROUND_STORAGE_KEY,
    HIDE_TASKBAR_ICON_STORAGE_KEY,
    LAST_SEEN_GUIDE_VERSION_STORAGE_KEY,
    MINIMIZE_TO_TRAY_STORAGE_KEY,
    ONBOARDING_COMPLETED_STORAGE_KEY,
    OPEN_PLAYER_ON_LAUNCH_STORAGE_KEY,
    AUTO_PLAY_ON_LAUNCH_STORAGE_KEY,
    SHOW_HARMONY_SUBTITLE_STORAGE_KEY,
    SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY,
    SUBTITLE_CONTENT_MODE_STORAGE_KEY,
    SUBTITLE_FONT_FAMILY_STORAGE_KEY,
    SUBTITLE_FONT_INHERITS_LYRICS_STORAGE_KEY,
    SUBTITLE_FONT_SCALE_STORAGE_KEY,
    SUBTITLE_FONT_STYLE_STORAGE_KEY,
    SUBTITLE_OVERLAY_BACKGROUND_STORAGE_KEY,
    SUBTITLE_OVERLAY_OPACITY_STORAGE_KEY,
    VISUALIZER_OPACITY_STORAGE_KEY,
    setStoredBoolean,
} from './settingsPersistenceCore';
import {
    DEFAULT_VISUALIZER_BACKGROUND_MODE,
} from './settingsPersistenceExtended';

// src/stores/settingsUi/createSettingsUiActionsAppearance.ts
// Modal, appearance, subtitle, background, and lyric-mode actions.

type SetState = StoreApi<SettingsUiState>['setState'];
type GetState = StoreApi<SettingsUiState>['getState'];

export const createSettingsUiActionsAppearance = (set: SetState, get: GetState) => ({
    setLastSeenGuideVersion: (version) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LAST_SEEN_GUIDE_VERSION_STORAGE_KEY, version);
        }
        set({ lastSeenGuideVersion: version });
    },
    setIsUserGuideModalOpen: (isOpen) => set({ isUserGuideModalOpen: isOpen }),
    setIsShortcutsCheatSheetOpen: (isOpen) => set({ isShortcutsCheatSheetOpen: isOpen }),
    setIsOnboardingOpen: (isOpen) => set({ isOnboardingOpen: isOpen }),
    setIsWhatsNewOpen: (isOpen) => set({ isWhatsNewOpen: isOpen }),
    completeOnboarding: (appVersion) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, 'true');
            if (appVersion) {
                localStorage.setItem(LAST_SEEN_GUIDE_VERSION_STORAGE_KEY, appVersion);
            }
        }
        set({
            onboardingCompleted: true,
            isOnboardingOpen: false,
            ...(appVersion ? { lastSeenGuideVersion: appVersion } : {}),
        });
    },
    markWhatsNewSeen: (appVersion) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LAST_SEEN_GUIDE_VERSION_STORAGE_KEY, appVersion);
        }
        set({
            lastSeenGuideVersion: appVersion,
            isWhatsNewOpen: false,
        });
    },
    setStatusSetter: (setter) => set({ statusSetter: setter }),
    setAudioQuality: (quality) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('default_audio_quality', quality);
        }
        set({ audioQuality: quality });
    },
    setTransparentPlayerBackgroundFromSystem: (enabled) => {
        setStoredBoolean('transparent_player_background', enabled);
        set({ transparentPlayerBackground: enabled });
    },
    handleTogglePlayerPageNativeBlur: (enable) => {
        setStoredBoolean('enable_player_page_native_blur', enable);
        set({ enablePlayerPageNativeBlur: enable });
        if (window.electron?.saveSettings) {
            void window.electron.saveSettings('enable_player_page_native_blur', enable);
        }
    },
    handleToggleAutoHidePlayerChrome: (enabled: boolean) => {
        localStorage.setItem('auto_hide_player_chrome', enabled ? 'true' : 'false');
        set({ autoHidePlayerChrome: enabled });
    },
    handleSetPlaybackPresentation: (presentation) => {
        const next = presentation === 'speaker' ? 'speaker' : 'default';
        localStorage.setItem(PLAYBACK_PRESENTATION_STORAGE_KEY, next);
        set({ playbackPresentation: next });
        if (next === 'speaker') {
            localStorage.setItem('auto_hide_player_chrome', 'true');
            set({ autoHidePlayerChrome: true });
            if (!get().harmonySubtitleBackground) {
                localStorage.setItem(HARMONY_SUBTITLE_BACKGROUND_STORAGE_KEY, 'true');
                set({ harmonySubtitleBackground: true });
            }
            if (!get().subtitleOverlayBackground) {
                localStorage.setItem(SUBTITLE_OVERLAY_BACKGROUND_STORAGE_KEY, 'true');
                set({ subtitleOverlayBackground: true });
            }
        }
    },
    handleToggleSpeakerStage: (enable) => {
        const currentlySpeaker = get().playbackPresentation === 'speaker';
        const nextSpeaker = typeof enable === 'boolean' ? enable : !currentlySpeaker;
        get().handleSetPlaybackPresentation(nextSpeaker ? 'speaker' : 'default');
    },
    setDesktopPreferenceSnapshot: (settings) => {
        const patch: Partial<SettingsUiState> = {};
        if (typeof settings.MINIMIZE_TO_TRAY === 'boolean') {
            patch.minimizeToTray = settings.MINIMIZE_TO_TRAY;
            setStoredBoolean(MINIMIZE_TO_TRAY_STORAGE_KEY, settings.MINIMIZE_TO_TRAY);
        }
        if (typeof settings.HIDE_TASKBAR_ICON === 'boolean') {
            patch.hideTaskbarIcon = settings.HIDE_TASKBAR_ICON;
            setStoredBoolean(HIDE_TASKBAR_ICON_STORAGE_KEY, settings.HIDE_TASKBAR_ICON);
        }
        set(patch);
    },
    setStoredCappellaEmojiPack: (pack) => set({ storedCappellaEmojiPack: pack }),
    setCappellaCustomEmojiImages: (images) => set({ cappellaCustomEmojiImages: images }),
    setIsLoadingCappellaCustomEmojiPack: (loading) => set({ isLoadingCappellaCustomEmojiPack: loading }),
    setStoredCappellaAvatarPack: (pack) => set({ storedCappellaAvatarPack: pack }),
    setCappellaCustomAvatarImages: (images) => set({ cappellaCustomAvatarImages: images }),
    setIsLoadingCappellaCustomAvatarPack: (loading) => set({ isLoadingCappellaCustomAvatarPack: loading }),
    setStoredMonetBackgroundImage: (image) => set({ storedMonetBackgroundImage: image }),
    setMonetBackgroundImage: (image) => set({ monetBackgroundImage: image }),
    setIsLoadingMonetBackgroundImage: (loading) => set({ isLoadingMonetBackgroundImage: loading }),
    setStoredMonetPortraitImage: (image) => set({ storedMonetPortraitImage: image }),
    setMonetPortraitImage: (image) => set({ monetPortraitImage: image }),
    setIsLoadingMonetPortraitImage: (loading) => set({ isLoadingMonetPortraitImage: loading }),
    clearLyricsCustomFontAfterRestoreFailure: (message) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('lyrics_custom_font');
        }
        set({ lyricsCustomFont: null });
        notify(get, message);
    },
    setIsSubSettingsViewOpen: (open) => set({ isSubSettingsViewOpen: open }),
    openSettings: (initialTab: SettingsModalInitialTab = 'help', initialSubview: SettingsSubviewId | null = null) => set({
        settingsModalState: {
            isOpen: true,
            initialTab,
            initialSubview,
        },
    }),
    closeSettings: () => set(state => ({
        settingsModalState: {
            ...state.settingsModalState,
            isOpen: false,
        },
    })),
    handleToggleCoverColorBg: (enable) => {
        setStoredBoolean('use_cover_color_bg', enable);
        set({ useCoverColorBg: enable });
        notify(get, {
            type: 'info',
            text: enable ? '添加封面色彩' : '使用默认色彩',
        });
    },
    handleToggleStaticMode: (enable) => {
        setStoredBoolean('static_mode', enable);
        set({ staticMode: enable });
        notify(get, {
            type: 'info',
            text: enable ? '静态模式已开启' : '静态模式已关闭',
        });
    },
    handleToggleDisableHomeDynamicBackground: (disable) => {
        setStoredBoolean('disable_home_dynamic_background', disable);
        set({ disableHomeDynamicBackground: disable });
        notify(get, {
            type: 'info',
            text: disable ? '主页动态背景已关闭' : '主页动态背景已开启',
        });
    },
    handleToggleAlternativeLyricSources: (enable) => {
        setStoredBoolean('enable_alternative_lyric_sources', enable);
        set({ enableAlternativeLyricSources: enable });
        notify(get, {
            type: 'info',
            text: enable ? '更多歌词源已开启' : '更多歌词源已关闭',
        });
    },
    handleToggleAutoUseBestLyric: (enable) => {
        setStoredBoolean('auto_use_best_lyric', enable);
        set({ autoUseBestLyric: enable });
        notify(get, {
            type: 'info',
            text: enable ? '自动使用最佳歌词已开启' : '自动使用最佳歌词已关闭',
        });
    },
    handleSetPreferredAlternativeLyricSource: (source) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred_alternative_lyric_source', source);
        }
        set({ preferredAlternativeLyricSource: source });
        notify(get, {
            type: 'info',
            text: `优先匹配歌词源已切换为${getLyricProviderPreferenceLabel(source)}`,
        });
    },
    handleSetLyricsResolveBaseUrl: (url) => {
        const next = url.trim().replace(/\/$/, '');
        if (typeof window !== 'undefined') {
            if (next) {
                localStorage.setItem('lyra_lyrics_resolve_base_url', next);
            } else {
                localStorage.removeItem('lyra_lyrics_resolve_base_url');
            }
        }
        set({ lyricsResolveBaseUrl: next });
    },
    handleSetLyricsResolveApiKey: (apiKey) => {
        const next = apiKey.trim();
        if (typeof window !== 'undefined') {
            if (next) {
                localStorage.setItem('lyra_lyrics_resolve_api_key', next);
            } else {
                localStorage.removeItem('lyra_lyrics_resolve_api_key');
            }
        }
        set({ lyricsResolveApiKey: next });
    },
    handleToggleHidePlayerTranslationSubtitle: (enable) => {
        setStoredBoolean('hide_player_translation_subtitle', enable);
        set({ hidePlayerTranslationSubtitle: enable });
        notify(get, {
            type: 'info',
            text: enable ? '底部字幕层已隐藏' : '底部字幕层已显示',
        });
    },
    handleToggleShowSubtitleTranslation: (enable) => {
        setStoredBoolean(SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY, enable);
        const subtitleContentMode: SubtitleContentMode = enable ? 'translation' : 'none';
        if (typeof window !== 'undefined') {
            localStorage.setItem(SUBTITLE_CONTENT_MODE_STORAGE_KEY, subtitleContentMode);
        }
        set({ showSubtitleTranslation: enable, subtitleContentMode });
        notify(get, {
            type: 'info',
            text: enable ? '字幕翻译已显示' : '字幕翻译已隐藏',
        });
    },
    handleSetSubtitleContentMode: (subtitleContentMode) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(SUBTITLE_CONTENT_MODE_STORAGE_KEY, subtitleContentMode);
        }
        const showSubtitleTranslation = subtitleContentMode !== 'none';
        setStoredBoolean(SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY, showSubtitleTranslation);
        set({ subtitleContentMode, showSubtitleTranslation });
        notify(get, {
            type: 'info',
            text: subtitleContentMode === 'romanization'
                ? '副字幕：罗马音'
                : subtitleContentMode === 'none'
                    ? '副字幕：不显示'
                    : '副字幕：翻译',
        });
    },
    handleToggleShowHarmonySubtitle: (enabled) => {
        setStoredBoolean(SHOW_HARMONY_SUBTITLE_STORAGE_KEY, enabled);
        set({ showHarmonySubtitle: enabled });
    },
    handleToggleHarmonySubtitleBackground: (enabled) => {
        setStoredBoolean(HARMONY_SUBTITLE_BACKGROUND_STORAGE_KEY, enabled);
        set({ harmonySubtitleBackground: enabled });
    },
    handleSetSubtitleFontScale: (scale) => {
        const next = Math.min(1.6, Math.max(0.7, scale));
        if (typeof window !== 'undefined') {
            localStorage.setItem(SUBTITLE_FONT_SCALE_STORAGE_KEY, String(next));
        }
        set({ subtitleFontScale: next });
    },
    handleToggleSubtitleOverlayBackground: (enabled) => {
        setStoredBoolean(SUBTITLE_OVERLAY_BACKGROUND_STORAGE_KEY, enabled);
        set({ subtitleOverlayBackground: enabled });
    },
    handleSetSubtitleFontInheritsLyrics: (inheritsLyrics) => {
        setStoredBoolean(SUBTITLE_FONT_INHERITS_LYRICS_STORAGE_KEY, inheritsLyrics);
        set({ subtitleFontInheritsLyrics: inheritsLyrics });
    },
    handleSetSubtitleFontStyle: (fontStyle) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(SUBTITLE_FONT_STYLE_STORAGE_KEY, fontStyle);
        }
        set({ subtitleFontStyle: fontStyle });
    },
    handleSetSubtitleFontFamily: (fontFamily) => {
        const next = fontFamily?.trim() || null;
        if (typeof window !== 'undefined') {
            if (next) {
                localStorage.setItem(SUBTITLE_FONT_FAMILY_STORAGE_KEY, next);
            } else {
                localStorage.removeItem(SUBTITLE_FONT_FAMILY_STORAGE_KEY);
            }
        }
        set({ subtitleFontFamily: next });
    },
    handleToggleHidePlayerRightPanelButton: (enable) => {
        setStoredBoolean('hide_player_right_panel_button', enable);
        set({ hidePlayerRightPanelButton: enable });
        notify(get, {
            type: 'info',
            text: enable ? '播放页右侧按钮已隐藏' : '播放页右侧按钮已显示',
        });
    },
    handleToggleTransparentPlayerBackground: (enable) => {
        setStoredBoolean('transparent_player_background', enable);
        set({ transparentPlayerBackground: enable });
        notify(get, {
            type: 'info',
            text: enable ? '播放页透明背景已开启' : '播放页透明背景已关闭',
        });
    },
    handleToggleDisableVisualizerVignette: (disable) => {
        setStoredBoolean('disable_visualizer_vignette', disable);
        set({ disableVisualizerVignette: disable });
        notify(get, {
            type: 'info',
            text: disable ? '播放页暗角效果已关闭' : '播放页暗角效果已开启',
        });
    },
    handleToggleEnableSmartAtmosphere: (enable) => {
        setStoredBoolean(ENABLE_SMART_ATMOSPHERE_STORAGE_KEY, enable);
        set({ enableSmartAtmosphere: enable });
        notify(get, {
            type: 'info',
            text: enable ? '智能氛围已开启' : '智能氛围已关闭',
        });
    },
    handleToggleEnableBilibiliVideoBackground: (enable) => {
        setStoredBoolean(ENABLE_BILIBILI_VIDEO_BACKGROUND_STORAGE_KEY, enable);
        set({ enableBilibiliVideoBackground: enable });
        notify(get, {
            type: 'info',
            text: enable ? 'B 站视频背景已开启' : 'B 站视频背景已关闭',
        });
    },
    handleToggleEnable3dInteractiveBackground: (_enable) => {
        void _enable;
        setStoredBoolean(ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY, false);
        set({ enable3dInteractiveBackground: false });
    },
    handleToggleMinimizeToTray: (enable) => {
        setStoredBoolean(MINIMIZE_TO_TRAY_STORAGE_KEY, enable);
        set({ minimizeToTray: enable });
        if (window.electron?.saveSettings) {
            void window.electron.saveSettings('MINIMIZE_TO_TRAY', enable);
        }
        notify(get, {
            type: 'info',
            text: enable ? '最小化将隐藏到托盘' : '最小化将保留在任务栏',
        });
    },
    handleToggleHideTaskbarIcon: (enable) => {
        setStoredBoolean(HIDE_TASKBAR_ICON_STORAGE_KEY, enable);
        set({ hideTaskbarIcon: enable });
        if (window.electron?.saveSettings) {
            void window.electron.saveSettings('HIDE_TASKBAR_ICON', enable);
        }
        notify(get, {
            type: 'info',
            text: enable ? '主窗口任务栏图标已隐藏' : '主窗口任务栏图标已恢复',
        });
    },
    handleToggleOpenPlayerOnLaunch: (enable) => {
        setStoredBoolean(OPEN_PLAYER_ON_LAUNCH_STORAGE_KEY, enable);
        set({ openPlayerOnLaunch: enable });
        notify(get, {
            type: 'info',
            text: enable ? '启动后将直接进入播放页' : '启动后将默认进入首页',
        });
    },
    handleToggleAutoPlayOnLaunch: (enable) => {
        setStoredBoolean(AUTO_PLAY_ON_LAUNCH_STORAGE_KEY, enable);
        set({ autoPlayOnLaunch: enable });
        notify(get, {
            type: 'info',
            text: i18n.t(enable ? 'status.autoPlayOnLaunchOn' : 'status.autoPlayOnLaunchOff'),
        });
    },
    handleToggleMediaCache: (enable) => {
        setStoredBoolean('enable_media_cache', enable);
        set({ enableMediaCache: enable });
    },
    handleToggleAutoResyncDownloadFolder: (enable) => {
        setStoredBoolean(AUTO_RESYNC_DOWNLOAD_FOLDER_KEY, enable);
        set({ autoResyncDownloadFolder: enable });
    },
    handleSetBackgroundOpacity: (opacity) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('background_opacity', String(opacity));
        }
        set({ backgroundOpacity: opacity });
    },
    handleSetSubtitleOverlayOpacity: (opacity) => {
        const next = Math.min(1, Math.max(0.2, opacity));
        if (typeof window !== 'undefined') {
            localStorage.setItem(SUBTITLE_OVERLAY_OPACITY_STORAGE_KEY, String(next));
        }
        set({ subtitleOverlayOpacity: next });
    },
    handleSetVisualizerOpacity: (opacity) => {
        const next = Math.min(1, Math.max(0.2, opacity));
        if (typeof window !== 'undefined') {
            localStorage.setItem(VISUALIZER_OPACITY_STORAGE_KEY, String(next));
        }
        set({ visualizerOpacity: next });
    },
    handleSetVisualizerBackgroundMode: (mode) => {
        const isElectron = typeof window !== 'undefined'
            && Boolean((window as Window & { electron?: unknown }).electron);
        const prevMode = get().visualizerBackgroundMode;
        const { resolvedMode, enable3dInteractiveBackground } = applyVisualizerBackgroundModeSelection({
            mode,
            isElectron,
            storage: typeof window !== 'undefined' ? localStorage : null,
        });
        set({
            visualizerBackgroundMode: resolvedMode,
            enable3dInteractiveBackground,
        });
        void import('../../utils/telemetry/trackTelemetry').then(({ trackTelemetry }) => {
            trackTelemetry('settings.changed', {
                data: {
                    key: 'visualizerBackgroundMode',
                    from: prevMode,
                    to: resolvedMode,
                },
            });
        });
    },
    handleResetVisualizerBackgroundMode: () => {
        const { resolvedMode, enable3dInteractiveBackground } = applyResetVisualizerBackgroundMode({
            defaultMode: DEFAULT_VISUALIZER_BACKGROUND_MODE,
            isElectron: typeof window !== 'undefined'
                && Boolean((window as Window & { electron?: unknown }).electron),
            devicePixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
            storage: typeof window !== 'undefined' ? localStorage : null,
        });
        set({
            visualizerBackgroundMode: resolvedMode,
            enable3dInteractiveBackground,
        });
    },
    forceSafeVisualizerBackgroundAfterGpuCrash: () => {
        set(applyGpuCrashVisualDemote({
            keep3dOptIn: false,
            storage: typeof window !== 'undefined' ? localStorage : null,
        }));
    },
    handleAddUrlBackgroundItem: (item) => {
        const sanitized = sanitizeUrlBackgroundItem(item);
        if (!sanitized) return;
        const next = [...get().urlBackgroundList, sanitized];
        if (typeof window !== 'undefined') {
            localStorage.setItem('url_background_list', JSON.stringify(next));
        }
        set({ urlBackgroundList: next });
    },
    handleUpdateUrlBackgroundItem: (id, patch) => {
        const next = get().urlBackgroundList.map(item =>
            item.id === id ? sanitizeUrlBackgroundItem({ ...item, ...patch, id: item.id }) ?? item : item
        );
        if (typeof window !== 'undefined') {
            localStorage.setItem('url_background_list', JSON.stringify(next));
        }
        set({ urlBackgroundList: next });
    },
    handleDeleteUrlBackgroundItem: (id) => {
        const next = get().urlBackgroundList.filter(item => item.id !== id);
        if (typeof window !== 'undefined') {
            localStorage.setItem('url_background_list', JSON.stringify(next));
        }
        const selectedId = get().urlBackgroundSelectedId;
        if (selectedId === id) {
            const newSelectedId = next.length > 0 ? next[0].id : null;
            if (typeof window !== 'undefined') {
                if (newSelectedId) {
                    localStorage.setItem('url_background_selected_id', newSelectedId);
                } else {
                    localStorage.removeItem('url_background_selected_id');
                }
            }
            set({ urlBackgroundList: next, urlBackgroundSelectedId: newSelectedId });
        } else {
            set({ urlBackgroundList: next });
        }
    },
    handleSetUrlBackgroundSelectedId: (id) => {
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('url_background_selected_id', id);
            } else {
                localStorage.removeItem('url_background_selected_id');
            }
        }
        set({ urlBackgroundSelectedId: id });
    },
    handleSetUrlBackgroundList: (items) => {
        const next = sanitizeUrlBackgroundList(items);
        const selectedId = get().urlBackgroundSelectedId;
        const nextSelectedId = selectedId && next.some(item => item.id === selectedId) ? selectedId : null;
        if (typeof window !== 'undefined') {
            localStorage.setItem('url_background_list', JSON.stringify(next));
            if (nextSelectedId) {
                localStorage.setItem('url_background_selected_id', nextSelectedId);
            } else {
                localStorage.removeItem('url_background_selected_id');
            }
        }
        set({ urlBackgroundList: next, urlBackgroundSelectedId: nextSelectedId });
    },
    handleSetVisualizerFrameRate: (frameRate) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(VISUALIZER_FRAME_RATE_STORAGE_KEY, String(frameRate));
        }
        setGlobalVisualizerFrameRate(frameRate);
        set({ visualizerFrameRate: frameRate });
    },
    setDaylightPreference: (enabled) => {
        setStoredBoolean('default_theme_daylight', enabled);
        set({ isDaylight: enabled });
        if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
            void window.electron.setNativeTheme(enabled ? 'light' : 'dark');
        }
    },
    handleSetVisualizerMode: (mode, options) => {
        // Legacy path: karaoke was briefly a visualizer mode.
        if (mode === 'karaoke') {
            get().handleSetLyricWordMode('karaoke');
            return;
        }
        const entry = getVisualizerRegistryEntry(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('visualizer_mode', mode);
        }
        const prevMode = get().visualizerMode;
        const plan = planVisualizerModeSwitchGpuSafety({
            prevMode,
            nextMode: mode,
            backgroundMode: get().visualizerBackgroundMode,
        });
        if (plan.noop) return;
        // Keep WebGL mounted. Pause particle ticks while DOM lyric modes remount.
        if (plan.applyModeWithYield) {
            set({ yieldInteractive3dParticles: true, visualizerMode: mode });
            scheduleInteractive3dParticleYieldResume({
                setYielding: (yielding) => set({ yieldInteractive3dParticles: yielding }),
                yieldMs: plan.settleMs,
            });
        } else if (plan.yieldParticles) {
            set({ yieldInteractive3dParticles: true });
            scheduleInteractive3dParticleYieldResume({
                setYielding: (yielding) => set({ yieldInteractive3dParticles: yielding }),
                yieldMs: plan.settleMs,
            });
            startTransition(() => {
                set({ visualizerMode: mode });
            });
        } else {
            startTransition(() => {
                set({ visualizerMode: mode });
            });
        }
        void import('../../utils/telemetry/trackTelemetry').then(({ trackTelemetry }) => {
            trackTelemetry('settings.changed', {
                data: { key: 'visualizerMode', from: prevMode, to: mode },
            });
        });
        if (options?.notify !== false) {
            notify(get, {
                type: 'info',
                text: `已切换到${entry.labelFallback}歌词`,
            });
        }
    },
    handleSetLyricWordMode: (mode) => {
        const next = parseLyricWordMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LYRIC_WORD_MODE_STORAGE_KEY, next);
        }
        set({ lyricWordMode: next });
    },
    handleSetLyricFontPresetId: (presetId) => {
        const next = parseLyricFontPresetId(presetId);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LYRIC_FONT_PRESET_STORAGE_KEY, next);
        }
        set({ lyricFontPresetId: next });
    },
    handleSetVisualEffectIntensity: (intensity) => {
        const next = parseLyricVisualEffectIntensity(intensity);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LYRIC_VISUAL_EFFECT_INTENSITY_STORAGE_KEY, next);
        }
        set({ visualEffectIntensity: next });
    },
    handleSetLyricEffectPackId: (packId) => {
        const next = parseLyricEffectPackId(packId);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LYRIC_EFFECT_PACK_STORAGE_KEY, next);
        }
        set({ lyricEffectPackId: next });
    },
});
