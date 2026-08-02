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
import { resolveStoredInteractive3dSceneTuning } from '../../components/visualizer/geometric/interactive3dSceneRegistry';
import { applyMineradioVisualPreset } from '../../components/visualizer/geometric/mineradioVisualPresets';
import type { MineradioVisualPresetId } from '../../types';
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
import { writeInteractive3dOptIn } from '../../utils/performance/electronInteractive3dGuardMath';
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
import { applyAppLanguagePreference } from '../../i18n/config';
import type { LocalBeatAnalysisPromptPolicy } from '../../utils/atmosphere/localBeatAnalysisPolicy';
import { scheduleInteractive3dParticleYieldResume } from '../../utils/visualizer/yieldInteractive3dParticlesForModeSwitch';
import { planVisualizerModeSwitchGpuSafety } from '../../utils/visualizer/visualizerModeSwitchGpuSafety';
import type { SettingsUiState } from './types';
import { notify } from './notify';
import {
    INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY,
    clampCladdaghEllipseTiltDeg,
    clampCladdaghFocusScaleRatio,
    clampCladdaghRadiusScale,
    clampClassicBreathingFloatMultiplier,
    clampClassicWordSpacing,
    clampFumeBackgroundObjectOpacity,
    clampFumeCameraSpeed,
    clampFumeGlowIntensity,
    clampFumeHeroScale,
    clampFumeTextHoldRatio,
    clampPartitaStagger,
    resolveCappellaAvatarSource,
    resolveFumeCameraTrackingMode,
    resolveStoredPendoloTuning,
    setStoredBoolean,
} from './settingsPersistenceCore';
import {
    LOCAL_BEAT_ANALYSIS_MODE_STORAGE_KEY,
    LOCAL_BEAT_ANALYSIS_PROMPT_STORAGE_KEY,
    resolveStoredCustomLyricsFont,
    resolveStoredLatentBackgroundTuning,
    resolveStoredMonetBackgroundTuning,
    resolveStoredMonetTuning,
} from './settingsPersistenceExtended';

// src/stores/settingsUi/createSettingsUiActionsTuning.ts
// Visualizer tuning, custom assets, lyrics fonts, and playback/home actions.

type SetState = StoreApi<SettingsUiState>['setState'];
type GetState = StoreApi<SettingsUiState>['getState'];

export const createSettingsUiActionsTuning = (set: SetState, get: GetState) => ({
    handleSetClassicTuning: (patch) => {
        const prev = get().classicTuning;
        const next = {
            enableWordRotation: patch.enableWordRotation ?? prev.enableWordRotation,
            breathingFloatMultiplier: clampClassicBreathingFloatMultiplier(
                patch.breathingFloatMultiplier ?? prev.breathingFloatMultiplier,
                prev.breathingFloatMultiplier,
            ),
            useLegacyLayout: patch.useLegacyLayout ?? prev.useLegacyLayout,
            wordSpacing: clampClassicWordSpacing(
                patch.wordSpacing ?? prev.wordSpacing,
                prev.wordSpacing ?? DEFAULT_CLASSIC_TUNING.wordSpacing!,
            ),
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('classic_tuning', JSON.stringify(next));
        }
        set({ classicTuning: next });
    },
    handleResetClassicTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('classic_tuning', JSON.stringify(DEFAULT_CLASSIC_TUNING));
        }
        set({ classicTuning: DEFAULT_CLASSIC_TUNING });
        notify(get, { type: 'info', text: '流光参数已重置' });
    },
    handleSetCadenzaTuning: (patch) => {
        const next = { ...get().cadenzaTuning, ...patch, beamIntensity: 0 };
        if (typeof window !== 'undefined') {
            localStorage.setItem('cadenza_tuning', JSON.stringify(next));
        }
        set({ cadenzaTuning: next });
    },
    handleResetCadenzaTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cadenza_tuning', JSON.stringify(DEFAULT_CADENZA_TUNING));
        }
        set({ cadenzaTuning: DEFAULT_CADENZA_TUNING });
        notify(get, { type: 'info', text: '心象参数已重置' });
    },
    handleSetPartitaTuning: (patch) => {
        const prev = get().partitaTuning;
        const rawMin = clampPartitaStagger(patch.staggerMin ?? prev.staggerMin, prev.staggerMin);
        const rawMax = clampPartitaStagger(patch.staggerMax ?? prev.staggerMax, prev.staggerMax);
        const next = {
            showGuideLines: patch.showGuideLines ?? prev.showGuideLines,
            useSemanticLayout: patch.useSemanticLayout ?? prev.useSemanticLayout,
            staggerMin: Math.min(rawMin, rawMax),
            staggerMax: Math.max(rawMin, rawMax),
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('partita_tuning', JSON.stringify(next));
        }
        set({ partitaTuning: next });
    },
    handleResetPartitaTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('partita_tuning', JSON.stringify(DEFAULT_PARTITA_TUNING));
        }
        set({ partitaTuning: DEFAULT_PARTITA_TUNING });
        notify(get, { type: 'info', text: '云阶参数已重置' });
    },
    handleSetFumeTuning: (patch) => {
        const prev = get().fumeTuning;
        const next = {
            hidePrintSymbols: patch.hidePrintSymbols ?? prev.hidePrintSymbols,
            disableGeometricBackground: patch.disableGeometricBackground ?? prev.disableGeometricBackground,
            backgroundObjectOpacity: clampFumeBackgroundObjectOpacity(
                patch.backgroundObjectOpacity ?? prev.backgroundObjectOpacity,
                prev.backgroundObjectOpacity,
            ),
            textHoldRatio: clampFumeTextHoldRatio(patch.textHoldRatio ?? prev.textHoldRatio, prev.textHoldRatio),
            cameraTrackingMode: resolveFumeCameraTrackingMode(patch.cameraTrackingMode ?? prev.cameraTrackingMode),
            cameraSpeed: clampFumeCameraSpeed(patch.cameraSpeed ?? prev.cameraSpeed, prev.cameraSpeed),
            glowIntensity: clampFumeGlowIntensity(patch.glowIntensity ?? prev.glowIntensity, prev.glowIntensity),
            heroScale: clampFumeHeroScale(patch.heroScale ?? prev.heroScale, prev.heroScale),
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('fume_tuning', JSON.stringify(next));
        }
        set({ fumeTuning: next });
    },
    handleResetFumeTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('fume_tuning', JSON.stringify(DEFAULT_FUME_TUNING));
        }
        set({ fumeTuning: DEFAULT_FUME_TUNING });
        notify(get, { type: 'info', text: '浮名参数已重置' });
    },
    handleSetCladdaghTuning: (patch) => {
        const prev = get().claddaghTuning;
        const next = {
            focusScaleRatio: clampCladdaghFocusScaleRatio(patch.focusScaleRatio ?? prev.focusScaleRatio, prev.focusScaleRatio),
            radiusScale: clampCladdaghRadiusScale(patch.radiusScale ?? prev.radiusScale, prev.radiusScale),
            ellipseTiltDeg: clampCladdaghEllipseTiltDeg(patch.ellipseTiltDeg ?? prev.ellipseTiltDeg, prev.ellipseTiltDeg),
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('claddagh_tuning', JSON.stringify(next));
        }
        set({ claddaghTuning: next });
    },
    handleResetCladdaghTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('claddagh_tuning', JSON.stringify(DEFAULT_CLADDAGH_TUNING));
        }
        set({ claddaghTuning: DEFAULT_CLADDAGH_TUNING });
        notify(get, { type: 'info', text: '回环参数已重置' });
    },
    handleSetCappellaTuning: (patch) => {
        const requestedCustomWithoutPack = patch.emojiPackSource === 'custom' && get().storedCappellaEmojiPack.length === 0;
        if (requestedCustomWithoutPack) {
            notify(get, { type: 'info', text: '请先上传自定义表情包' });
        }

        const prev = get().cappellaTuning;
        const next = {
            showEmoMessages: patch.showEmoMessages ?? prev.showEmoMessages,
            emojiPackSource: patch.emojiPackSource === 'custom' && get().storedCappellaEmojiPack.length === 0
                ? 'builtin' as const
                : (patch.emojiPackSource ?? prev.emojiPackSource),
            avatarSource: resolveCappellaAvatarSource(patch.avatarSource ?? prev.avatarSource),
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('cappella_tuning', JSON.stringify(next));
        }
        set({ cappellaTuning: next });
    },
    handleResetCappellaTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cappella_tuning', JSON.stringify(DEFAULT_CAPPELLA_TUNING));
        }
        set({ cappellaTuning: DEFAULT_CAPPELLA_TUNING });
        notify(get, { type: 'info', text: '群唱参数已重置' });
    },
    handleSetTiltTuning: (patch) => {
        const prev = get().tiltTuning;
        const next = {
            splitProbability: Math.min(1, Math.max(0, patch.splitProbability ?? prev.splitProbability)),
            tiltStyleProbability: Math.min(1, Math.max(0, patch.tiltStyleProbability ?? prev.tiltStyleProbability)),
            colorScheme: patch.colorScheme ?? prev.colorScheme,
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('tilt_tuning', JSON.stringify(next));
        }
        set({ tiltTuning: next });
    },
    handleResetTiltTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('tilt_tuning', JSON.stringify(DEFAULT_TILT_TUNING));
        }
        set({ tiltTuning: DEFAULT_TILT_TUNING });
        notify(get, { type: 'info', text: '倾诉参数已重置' });
    },
    handleSetPendoloTuning: (patch) => {
        const next = resolveStoredPendoloTuning({ ...get().pendoloTuning, ...patch });
        if (typeof window !== 'undefined') {
            localStorage.setItem('pendolo_tuning', JSON.stringify(next));
        }
        set({ pendoloTuning: next });
    },
    handleResetPendoloTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pendolo_tuning', JSON.stringify(DEFAULT_PENDOLO_TUNING));
        }
        set({ pendoloTuning: DEFAULT_PENDOLO_TUNING });
        notify(get, { type: 'info', text: '时计参数已重置' });
    },
    handleSetMonetBackgroundTuning: (patch) => {
        const prev = get().monetBackgroundTuning;
        const next = resolveStoredMonetBackgroundTuning({
            ...prev,
            ...patch,
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem('monet_background_tuning', JSON.stringify(next));
        }
        set({ monetBackgroundTuning: next });
    },
    handleResetMonetBackgroundTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('monet_background_tuning', JSON.stringify(DEFAULT_MONET_BACKGROUND_TUNING));
        }
        set({ monetBackgroundTuning: DEFAULT_MONET_BACKGROUND_TUNING });
        notify(get, { type: 'info', text: '莫奈背景参数已重置' });
    },
    handleSetLatentBackgroundTuning: (patch) => {
        const prev = get().latentBackgroundTuning;
        const next = resolveStoredLatentBackgroundTuning({
            ...prev,
            ...patch,
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem('latent_background_tuning', JSON.stringify(next));
        }
        set({ latentBackgroundTuning: next });
    },
    handleResetLatentBackgroundTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('latent_background_tuning', JSON.stringify(DEFAULT_LATENT_BACKGROUND_TUNING));
        }
        set({ latentBackgroundTuning: DEFAULT_LATENT_BACKGROUND_TUNING });
        notify(get, { type: 'info', text: 'Latent 背景参数已重置' });
    },
    handleSetInteractive3dSceneTuning: (patch) => {
        const prev = get().interactive3dSceneTuning;
        // visualPreset is user-owned: only change when the patch explicitly sets it.
        const next = resolveStoredInteractive3dSceneTuning({
            ...prev,
            ...patch,
            visualPreset: patch.visualPreset !== undefined ? patch.visualPreset : prev.visualPreset,
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem(INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY, JSON.stringify(next));
        }
        set({ interactive3dSceneTuning: next });
    },
    handleSelectInteractive3dVisualPreset: (preset: MineradioVisualPresetId) => {
        // One store update: clear GPU lockout + enter interactive3d + apply preset bundle.
        // Split set() calls made 通用↔星河 chips look inert under React batching races.
        const isElectron = typeof window !== 'undefined'
            && Boolean((window as Window & { electron?: unknown }).electron);
        const { resolvedMode, enable3dInteractiveBackground } = applyVisualizerBackgroundModeSelection({
            mode: 'interactive3d',
            isElectron,
            storage: typeof window !== 'undefined' ? localStorage : null,
        });
        const next = resolveStoredInteractive3dSceneTuning(
            applyMineradioVisualPreset(preset, get().interactive3dSceneTuning),
        );
        if (typeof window !== 'undefined') {
            localStorage.setItem(INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY, JSON.stringify(next));
        }
        set({
            visualizerBackgroundMode: resolvedMode,
            enable3dInteractiveBackground,
            interactive3dSceneTuning: next,
        });
    },
    handleResetInteractive3dSceneTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY,
                JSON.stringify(DEFAULT_INTERACTIVE3D_SCENE_TUNING),
            );
        }
        set({ interactive3dSceneTuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING });
        notify(get, { type: 'info', text: '3D 场景参数已重置' });
    },
    handleSetMonetTuning: (patch) => {
        const prev = get().monetTuning;
        const next = resolveStoredMonetTuning({
            ...prev,
            ...patch,
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem('monet_tuning', JSON.stringify(next));
        }
        set({ monetTuning: next });
    },
    handleResetMonetTuning: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('monet_tuning', JSON.stringify(DEFAULT_MONET_TUNING));
        }
        set({ monetTuning: DEFAULT_MONET_TUNING });
        notify(get, { type: 'info', text: '莫奈参数已重置' });
    },
    handleUploadMonetBackgroundImage: async (files) => {
        const file = files[0];
        if (!file) {
            return { ok: false, error: '请选择图片文件。' };
        }

        if (!isSupportedMonetBackgroundFile(file)) {
            return { ok: false, error: '仅支持 png、jpg、jpeg、gif、webp、svg 图片。' };
        }

        const image = buildStoredMonetBackgroundImage(file);
        await saveMonetBackgroundImage(image);
        set({ storedMonetBackgroundImage: image });
        notify(get, { type: 'success', text: 'Monet 背景图已更新' });
        return { ok: true };
    },
    handleClearMonetBackgroundImage: async () => {
        await clearMonetBackgroundImage();
        const prev = get().monetBackgroundTuning;
        const nextTuning = prev.backgroundSource === 'uploaded-global'
            ? { ...prev, backgroundSource: 'cover-derived' as const }
            : prev;
        if (nextTuning !== prev && typeof window !== 'undefined') {
            localStorage.setItem('monet_background_tuning', JSON.stringify(nextTuning));
        }
        set({
            storedMonetBackgroundImage: null,
            monetBackgroundImage: null,
            monetBackgroundTuning: nextTuning,
        });
        notify(get, { type: 'info', text: 'Monet 背景图已清空' });
    },
    handleUploadMonetPortraitImage: async (files) => {
        const file = files[0];
        if (!file) {
            return { ok: false, error: '请选择图片文件。' };
        }

        if (!isSupportedMonetPortraitFile(file)) {
            return { ok: false, error: '仅支持 png、jpg、jpeg、gif、webp、svg 图片。' };
        }

        const image = buildStoredMonetPortraitImage(file);
        await saveMonetPortraitImage(image);
        set({ storedMonetPortraitImage: image });
        notify(get, { type: 'success', text: 'Monet 肖像图已更新' });
        return { ok: true };
    },
    handleClearMonetPortraitImage: async () => {
        await clearMonetPortraitImage();
        const prev = get().monetTuning;
        const nextTuning = prev.portraitSource === 'custom'
            ? { ...prev, portraitSource: 'cover' as const }
            : prev;
        if (nextTuning !== prev && typeof window !== 'undefined') {
            localStorage.setItem('monet_tuning', JSON.stringify(nextTuning));
        }
        set({
            storedMonetPortraitImage: null,
            monetPortraitImage: null,
            monetTuning: nextTuning,
        });
        notify(get, { type: 'info', text: 'Monet 肖像图已清空' });
    },
    handleImportCustomCappellaEmojiPack: async (files) => {
        if (files.length === 0) {
            return { ok: false, error: '请选择图片文件。' };
        }

        const storedCappellaEmojiPack = get().storedCappellaEmojiPack;

        if (!files.every(isSupportedCappellaEmojiFile)) {
            return { ok: false, error: '仅支持 png、jpg、jpeg、gif、webp、svg 图片。' };
        }

        const appendedPack = buildStoredCappellaEmojiPack(files);
        const storedPack = [...storedCappellaEmojiPack, ...appendedPack];
        await saveCustomCappellaEmojiPack(storedPack);
        set({ storedCappellaEmojiPack: storedPack });
        notify(get, {
            type: 'success',
            text: `已新增 ${appendedPack.length} 张群唱表情包，当前共 ${storedPack.length} 张`,
        });

        return { ok: true };
    },
    handleClearCustomCappellaEmojiPack: async () => {
        await clearCustomCappellaEmojiPack();
        const prev = get().cappellaTuning;
        const nextTuning = prev.emojiPackSource === 'custom'
            ? { ...prev, emojiPackSource: 'builtin' as const }
            : prev;
        if (nextTuning !== prev && typeof window !== 'undefined') {
            localStorage.setItem('cappella_tuning', JSON.stringify(nextTuning));
        }
        set({
            storedCappellaEmojiPack: [],
            cappellaTuning: nextTuning,
        });
        notify(get, { type: 'info', text: '自定义群唱表情包已清空' });
    },
    handleImportCustomCappellaAvatar: async (files) => {
        if (files.length === 0) {
            return { ok: false, error: '请选择图片文件。' };
        }

        const storedCappellaAvatarPack = get().storedCappellaAvatarPack;

        if (!files.every(isSupportedCappellaAvatarFile)) {
            return { ok: false, error: '仅支持 png、jpg、jpeg、gif、webp、svg 图片。' };
        }

        const builtPack = buildStoredCappellaAvatar(files);
        const storedPack = [...storedCappellaAvatarPack, ...builtPack];
        await saveCustomCappellaAvatar(storedPack);
        set({ storedCappellaAvatarPack: storedPack });
        notify(get, {
            type: 'success',
            text: `已新增 ${builtPack.length} 张自定义头像，当前共 ${storedPack.length} 张`,
        });

        return { ok: true };
    },
    handleClearCustomCappellaAvatar: async () => {
        await clearCustomCappellaAvatar();
        const prev = get().cappellaTuning;
        const nextTuning = prev.avatarSource === 'custom'
            ? { ...prev, avatarSource: 'builtin' as const }
            : prev;
        if (nextTuning !== prev && typeof window !== 'undefined') {
            localStorage.setItem('cappella_tuning', JSON.stringify(nextTuning));
        }
        set({
            storedCappellaAvatarPack: [],
            cappellaTuning: nextTuning,
        });
        notify(get, { type: 'info', text: '自定义头像已清空' });
    },
    handleSetLyricsFontStyle: (fontStyle) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lyrics_font_style', fontStyle);
        }
        set({ lyricsFontStyle: fontStyle });
    },
    handleSetLyricsFontScale: (fontScale) => {
        const next = clampLyricsFontScale(fontScale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('lyrics_font_scale', String(next));
        }
        set({ lyricsFontScale: next });
    },
    handleSetLyricsCustomFont: (font) => {
        if (!font?.family?.trim()) {
            set({ lyricsCustomFont: null });
            if (typeof window !== 'undefined') {
                localStorage.removeItem('lyrics_custom_font');
            }
            void clearUploadedLyricsFont();
            return;
        }

        const next = resolveStoredCustomLyricsFont(font);
        if (!next) {
            set({ lyricsCustomFont: null });
            if (typeof window !== 'undefined') {
                localStorage.removeItem('lyrics_custom_font');
            }
            void clearUploadedLyricsFont();
            return;
        }

        if (next.source !== 'uploaded') {
            void clearUploadedLyricsFont();
        }

        set({ lyricsCustomFont: next });
        if (typeof window !== 'undefined') {
            localStorage.setItem('lyrics_custom_font', JSON.stringify(next));
        }
    },
    handleUploadLyricsCustomFont: async (file) => {
        try {
            const { meta } = await uploadAndRegisterLyricsFont(file);
            set({ lyricsCustomFont: meta });
            if (typeof window !== 'undefined') {
                localStorage.setItem('lyrics_custom_font', JSON.stringify(meta));
            }
            notify(get, {
                type: 'success',
                text: `已启用上传字体：${meta.label || meta.family}`,
            });

            return { ok: true };
        } catch (error) {
            const message = error instanceof Error && error.message
                ? error.message
                : '上传字体失败。';
            notify(get, { type: 'error', text: message });

            return { ok: false, error: message };
        }
    },
    handleSetAppLanguagePreference: async (preference) => {
        await applyAppLanguagePreference(preference);
        set({ appLanguagePreference: preference });
        notify(get, {
            type: 'info',
            text: preference === 'system'
                ? '界面语言已切换为跟随系统'
                : `界面语言已切换为 ${preference === 'zh-CN' ? '简体中文' : 'English'}`,
        });
    },
    handleSetLyricFilterPattern: (pattern) => {
        const next = pattern.trim();
        set({ lyricFilterPattern: next });

        if (typeof window === 'undefined') {
            return;
        }

        if (next) {
            localStorage.setItem('lyrics_filter_pattern', next);
        } else {
            localStorage.removeItem('lyrics_filter_pattern');
        }
    },
    handleToggleOpenPanelCloseButton: (enable) => {
        setStoredBoolean('show_open_panel_close_button', enable);
        set({ showOpenPanelCloseButton: enable });
        notify(get, {
            type: 'info',
            text: enable ? '已显示面板关闭按钮' : '已隐藏面板关闭按钮',
        });
    },
    handleToggleNowPlayingStage: (enable) => {
        setStoredBoolean('enable_now_playing_stage', enable);
        set({ enableNowPlayingStage: enable });
        notify(get, {
            type: 'info',
            text: enable ? '舞台模式已启用' : '舞台模式已关闭',
        });
    },
    handleSetQueueAddBehavior: (behavior) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('queue_add_behavior', behavior);
        }
        set({ queueAddBehavior: behavior });
        notify(get, {
            type: 'info',
            text: behavior === 'next' ? '加入队列将插到下一首' : '加入队列将追加到末尾',
        });
    },
    handleSetLocalBeatAnalysisMode: (mode) => {
        const resolved = mode === 'dj' ? 'dj' : 'mr';
        if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_BEAT_ANALYSIS_MODE_STORAGE_KEY, resolved);
        }
        set({ localBeatAnalysisMode: resolved });
        notify(get, {
            type: 'info',
            text: resolved === 'dj' ? '本地节奏分析已切换为强节奏' : '本地节奏分析已切换为电影视角',
        });
    },
    handleSetLocalBeatAnalysisPromptPolicy: (policy) => {
        const resolved: LocalBeatAnalysisPromptPolicy = policy === 'ask' ? 'ask' : 'auto';
        if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_BEAT_ANALYSIS_PROMPT_STORAGE_KEY, resolved);
        }
        set({ localBeatAnalysisPromptPolicy: resolved });
        notify(get, {
            type: 'info',
            text: resolved === 'ask' ? '本地节奏将在播放时询问' : '本地节奏将在后台静默分析',
        });
    },
    handleSetAudioOutputDeviceId: (deviceId) => {
        set({ audioOutputDeviceId: deviceId });
        if (typeof window === 'undefined') {
            return;
        }

        if (deviceId) {
            localStorage.setItem('audio_output_device_id', deviceId);
        } else {
            localStorage.removeItem('audio_output_device_id');
        }
    },
    handleSetVolume: (val) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('player_volume', String(val));
        }
        set({ volume: val });
    },
    handleToggleMute: () => {
        const next = !get().isMuted;
        setStoredBoolean('player_is_muted', next);
        set({ isMuted: next });
    },
    handleToggleLoopMode: () => {
        const prev = get().loopMode;
        const next = prev === 'off'
            ? 'all'
            : prev === 'all'
                ? 'one'
                : 'off';
        if (typeof window !== 'undefined') {
            localStorage.setItem('player_loop_mode', next);
        }
        set({ loopMode: next });
    },
    handleSetGridViewCardLayout: (layout) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('grid_view_card_layout', layout);
        }
        set({ gridViewCardLayout: layout });
    },
    handleTogglePlayerLyricsVisible: (visible) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('player_lyrics_visible', String(visible));
        }
        set({ playerLyricsVisible: visible });
    },
    handleSetHomeLayoutStyle: (style) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('home_layout_style', style);
        }
        set({ homeLayoutStyle: style });
        notify(get, {
            type: 'info',
            text: style === 'grid' ? '首页布局已切换为万象' : '首页布局已切换为经典',
        });
    },
    handleSetGrid3dCardStyle: (style) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('grid3d_card_style', style);
        }
        set({ grid3dCardStyle: style });
        notify(get, {
            type: 'info',
            text: style === 'image' ? '卡片样式已切换为纯图片封面' : '卡片样式已切换为拍立得卡片',
        });
    },
});
