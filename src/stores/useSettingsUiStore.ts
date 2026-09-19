export type {
    StatusSetter,
    AudioQuality,
    SettingsModalInitialTab,
    SettingsSubviewId,
    SettingsModalState,
    SettingsUiState,
} from './settingsUi/types';

export {
    CACHE_SIZE_KEY,
    MINIMIZE_TO_TRAY_STORAGE_KEY,
    HIDE_TASKBAR_ICON_STORAGE_KEY,
    OPEN_PLAYER_ON_LAUNCH_STORAGE_KEY,
    SUBTITLE_OVERLAY_OPACITY_STORAGE_KEY,
    SHOW_SUBTITLE_TRANSLATION_STORAGE_KEY,
    SHOW_HARMONY_SUBTITLE_STORAGE_KEY,
    HARMONY_SUBTITLE_BACKGROUND_STORAGE_KEY,
    SUBTITLE_CONTENT_MODE_STORAGE_KEY,
    SUBTITLE_OVERLAY_BACKGROUND_STORAGE_KEY,
    VISUALIZER_OPACITY_STORAGE_KEY,
    ENABLE_SMART_ATMOSPHERE_STORAGE_KEY,
        PLAYBACK_PRESENTATION_STORAGE_KEY,
    ENABLE_BILIBILI_VIDEO_BACKGROUND_STORAGE_KEY,
    INTERACTIVE_3D_SCENE_TUNING_STORAGE_KEY,
    ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY,
    readDefaultDaylightPreference,
    readStoredSubtitleContentMode,
    resolveStoredCappellaTuning,
} from './settingsUi/settingsPersistenceCore';

export {
    DEFAULT_VISUALIZER_BACKGROUND_MODE,
    resolveVisualizerBackgroundMode,
    resolveStoredLatentBackgroundTuning,
    resolveStoredMonetBackgroundTuning,
    resolveStoredMonetTuning,
    resolveStoredCustomLyricsFont,
} from './settingsUi/settingsPersistenceExtended';

export { useSettingsUiStore } from './settingsUi/createSettingsUiStore';
export { selectSettingsUiSnapshot } from './settingsUi/selectSettingsUiSnapshot';

import { useSettingsUiStore } from './settingsUi/createSettingsUiStore';

// src/stores/useSettingsUiStore.ts
// Public barrel for the settings UI store (implementation lives in settingsUi/).

if (typeof window !== 'undefined' && window.electron?.setNativeTheme) {
    void window.electron.setNativeTheme(useSettingsUiStore.getState().isDaylight ? 'light' : 'dark');
}
