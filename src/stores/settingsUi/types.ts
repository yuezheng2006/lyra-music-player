import type { Dispatch, SetStateAction } from 'react';
import type {
    CadenzaTuning,
    CappellaAvatarImage,
    CappellaEmojiImage,
    CappellaTuning,
    ClassicTuning,
    CladdaghTuning,
    FumeTuning,
    GridViewCardLayout,
    Interactive3dSceneTuning,
    LatentBackgroundTuning,
    LyricProviderSource,
    MineradioVisualPresetId,
    LyricWordMode,
    MonetBackgroundImage,
    MonetBackgroundTuning,
    MonetPortraitImage,
    MonetTuning,
    PartitaTuning,
    PendoloTuning,
    PlaybackPresentation,
    QueueAddBehavior,
    StatusMessage,
    StoredCappellaAvatarImage,
    StoredCappellaEmojiImage,
    StoredCustomLyricsFont,
    StoredMonetBackgroundImage,
    StoredMonetPortraitImage,
    SubtitleContentMode,
    Theme,
    TiltTuning,
    UrlBackgroundItem,
    VisualizerBackgroundMode,
    VisualizerFrameRate,
    VisualizerMode,
} from '../../types';
import type { AppLanguagePreference } from '../../i18n/config';
import type { LyricVisualEffectIntensity } from '../../utils/lyricVisualEffects';
import type { LyricEffectPackId } from '../../utils/lyricEffectPacks';
import type { LocalBeatAnalysisMode } from '../../utils/atmosphere/localBeatMapCache';
import type { LocalBeatAnalysisPromptPolicy } from '../../utils/atmosphere/localBeatAnalysisPolicy';
import type { GridViewCollectionDescriptor } from '../../components/app/home/gridViewCollectionAdapters';

// src/stores/settingsUi/types.ts
// Settings UI store public types.

export type StatusSetter = Dispatch<SetStateAction<StatusMessage | null>>;

export type AudioQuality = 'exhigh' | 'lossless' | 'hires';
export type SettingsModalInitialTab = 'help' | 'options';
export type SettingsSubviewId = 'appearance' | 'general' | 'playback' | 'integration' | 'storage' | 'desktop' | 'lab' | 'visualizer' | 'themePark' | 'lyricFilter';
export type SettingsModalState = {
    isOpen: boolean;
    initialTab: SettingsModalInitialTab;
    initialSubview?: SettingsSubviewId | null;
};

export type SettingsUiState = {
    statusSetter: StatusSetter | null;
    audioQuality: AudioQuality;
    useCoverColorBg: boolean;
    staticMode: boolean;
    disableHomeDynamicBackground: boolean;
    enableAlternativeLyricSources: boolean;
    autoUseBestLyric: boolean;
    preferredAlternativeLyricSource: LyricProviderSource;
    /** Private lyrics resolve service base URL (empty = disabled / use env). */
    lyricsResolveBaseUrl: string;
    /** Private lyrics resolve service API key. */
    lyricsResolveApiKey: string;
    hidePlayerTranslationSubtitle: boolean;
    showSubtitleTranslation: boolean;
    subtitleContentMode: SubtitleContentMode;
    showHarmonySubtitle: boolean;
    harmonySubtitleBackground: boolean;
    subtitleFontScale: number;
    subtitleOverlayBackground: boolean;
    subtitleFontInheritsLyrics: boolean;
    subtitleFontStyle: Theme['fontStyle'];
    subtitleFontFamily: string | null;
    hidePlayerRightPanelButton: boolean;
    transparentPlayerBackground: boolean;
    enablePlayerPageNativeBlur: boolean;
    autoHidePlayerChrome: boolean;
    /** default player chrome vs speaker-stage immersion (glass + MoodLyric). */
    playbackPresentation: PlaybackPresentation;
    disableVisualizerVignette: boolean;
    enableSmartAtmosphere: boolean;
    enableBilibiliVideoBackground: boolean;
    enable3dInteractiveBackground: boolean;
    minimizeToTray: boolean;
    hideTaskbarIcon: boolean;
    openPlayerOnLaunch: boolean;
    enableMediaCache: boolean;
    backgroundOpacity: number;
    subtitleOverlayOpacity: number;
    visualizerOpacity: number;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    urlBackgroundList: UrlBackgroundItem[];
    urlBackgroundSelectedId: string | null;
    visualizerFrameRate: VisualizerFrameRate;
    isDaylight: boolean;
    visualizerMode: VisualizerMode;
    /** Transient: pause interactive3d particle ticks while lyric modes remount (context stays up). */
    yieldInteractive3dParticles: boolean;
    /** Hold: keep particle ticks paused while background/lyric shortcut menu is open. */
    holdInteractive3dParticleYield: boolean;
    setHoldInteractive3dParticleYield: (held: boolean) => void;
    lyricWordMode: LyricWordMode;
    lyricFontPresetId: string;
    visualEffectIntensity: LyricVisualEffectIntensity;
    lyricEffectPackId: LyricEffectPackId;
    classicTuning: ClassicTuning;
    cadenzaTuning: CadenzaTuning;
    partitaTuning: PartitaTuning;
    fumeTuning: FumeTuning;
    claddaghTuning: CladdaghTuning;
    cappellaTuning: CappellaTuning;
    tiltTuning: TiltTuning;
    pendoloTuning: PendoloTuning;
    monetBackgroundTuning: MonetBackgroundTuning;
    latentBackgroundTuning: LatentBackgroundTuning;
    interactive3dSceneTuning: Interactive3dSceneTuning;
    monetTuning: MonetTuning;
    storedCappellaEmojiPack: StoredCappellaEmojiImage[];
    cappellaCustomEmojiImages: CappellaEmojiImage[];
    isLoadingCappellaCustomEmojiPack: boolean;
    storedCappellaAvatarPack: StoredCappellaAvatarImage[];
    cappellaCustomAvatarImages: CappellaAvatarImage[];
    isLoadingCappellaCustomAvatarPack: boolean;
    storedMonetBackgroundImage: StoredMonetBackgroundImage | null;
    monetBackgroundImage: MonetBackgroundImage | null;
    isLoadingMonetBackgroundImage: boolean;
    storedMonetPortraitImage: StoredMonetPortraitImage | null;
    monetPortraitImage: MonetPortraitImage | null;
    isLoadingMonetPortraitImage: boolean;
    appLanguagePreference: AppLanguagePreference;
    lyricsFontStyle: Theme['fontStyle'];
    lyricsFontScale: number;
    lyricsCustomFont: StoredCustomLyricsFont | null;
    lyricFilterPattern: string;
    showOpenPanelCloseButton: boolean;
    enableNowPlayingStage: boolean;
    queueAddBehavior: QueueAddBehavior;
    localBeatAnalysisMode: LocalBeatAnalysisMode;
    localBeatAnalysisPromptPolicy: LocalBeatAnalysisPromptPolicy;
    audioOutputDeviceId: string;
    volume: number;
    isMuted: boolean;
    loopMode: 'off' | 'all' | 'one';
    gridViewCardLayout: GridViewCardLayout;
    playerLyricsVisible: boolean;
    homeLayoutStyle: 'carousel' | 'grid';
    grid3dCardStyle: 'image' | 'card';
    activeGridViewCollection: GridViewCollectionDescriptor | null;
    setActiveGridViewCollection: (collection: GridViewCollectionDescriptor | null) => void;
    isSubSettingsViewOpen: boolean;
    settingsModalState: SettingsModalState;
    lastSeenGuideVersion: string | null;
    isUserGuideModalOpen: boolean;
    isShortcutsCheatSheetOpen: boolean;
    onboardingCompleted: boolean;
    isOnboardingOpen: boolean;
    isWhatsNewOpen: boolean;
    setLastSeenGuideVersion: (version: string) => void;
    setIsUserGuideModalOpen: (isOpen: boolean) => void;
    setIsShortcutsCheatSheetOpen: (isOpen: boolean) => void;
    setIsOnboardingOpen: (isOpen: boolean) => void;
    setIsWhatsNewOpen: (isOpen: boolean) => void;
    completeOnboarding: (appVersion?: string | null) => void;
    markWhatsNewSeen: (appVersion: string) => void;
    setStatusSetter: (setter: StatusSetter | null) => void;
    setAudioQuality: (quality: AudioQuality) => void;
    setTransparentPlayerBackgroundFromSystem: (enabled: boolean) => void;
    handleTogglePlayerPageNativeBlur: (enable: boolean) => void;
    setDesktopPreferenceSnapshot: (settings: { MINIMIZE_TO_TRAY?: unknown; HIDE_TASKBAR_ICON?: unknown; }) => void;
    setStoredCappellaEmojiPack: (pack: StoredCappellaEmojiImage[]) => void;
    setCappellaCustomEmojiImages: (images: CappellaEmojiImage[]) => void;
    setIsLoadingCappellaCustomEmojiPack: (loading: boolean) => void;
    setStoredCappellaAvatarPack: (pack: StoredCappellaAvatarImage[]) => void;
    setCappellaCustomAvatarImages: (images: CappellaAvatarImage[]) => void;
    setIsLoadingCappellaCustomAvatarPack: (loading: boolean) => void;
    setStoredMonetBackgroundImage: (image: StoredMonetBackgroundImage | null) => void;
    setMonetBackgroundImage: (image: MonetBackgroundImage | null) => void;
    setIsLoadingMonetBackgroundImage: (loading: boolean) => void;
    setStoredMonetPortraitImage: (image: StoredMonetPortraitImage | null) => void;
    setMonetPortraitImage: (image: MonetPortraitImage | null) => void;
    setIsLoadingMonetPortraitImage: (loading: boolean) => void;
    clearLyricsCustomFontAfterRestoreFailure: (message: StatusMessage) => void;
    setIsSubSettingsViewOpen: (open: boolean) => void;
    openSettings: (initialTab?: SettingsModalInitialTab, initialSubview?: SettingsSubviewId | null) => void;
    closeSettings: () => void;
    handleToggleCoverColorBg: (enable: boolean) => void;
    handleToggleStaticMode: (enable: boolean) => void;
    handleToggleDisableHomeDynamicBackground: (disable: boolean) => void;
    handleToggleAlternativeLyricSources: (enable: boolean) => void;
    handleToggleAutoUseBestLyric: (enable: boolean) => void;
    handleSetPreferredAlternativeLyricSource: (source: LyricProviderSource) => void;
    handleSetLyricsResolveBaseUrl: (url: string) => void;
    handleSetLyricsResolveApiKey: (apiKey: string) => void;
    handleToggleHidePlayerTranslationSubtitle: (enable: boolean) => void;
    handleToggleShowSubtitleTranslation: (enable: boolean) => void;
    handleSetSubtitleContentMode: (mode: SubtitleContentMode) => void;
    handleToggleShowHarmonySubtitle: (enabled: boolean) => void;
    handleToggleHarmonySubtitleBackground: (enabled: boolean) => void;
    handleSetSubtitleFontScale: (scale: number) => void;
    handleToggleSubtitleOverlayBackground: (enabled: boolean) => void;
    handleSetSubtitleFontInheritsLyrics: (inheritsLyrics: boolean) => void;
    handleSetSubtitleFontStyle: (fontStyle: Theme['fontStyle']) => void;
    handleSetSubtitleFontFamily: (fontFamily: string | null) => void;
    handleToggleHidePlayerRightPanelButton: (enable: boolean) => void;
    handleToggleTransparentPlayerBackground: (enable: boolean) => void;
    handleToggleAutoHidePlayerChrome: (enable: boolean) => void;
    handleSetPlaybackPresentation: (presentation: PlaybackPresentation) => void;
    handleToggleSpeakerStage: (enable?: boolean) => void;
    handleToggleDisableVisualizerVignette: (disable: boolean) => void;
    handleToggleEnableSmartAtmosphere: (enable: boolean) => void;
    handleToggleEnableBilibiliVideoBackground: (enable: boolean) => void;
    handleToggleEnable3dInteractiveBackground: (enable: boolean) => void;
    handleToggleMinimizeToTray: (enable: boolean) => void;
    handleToggleHideTaskbarIcon: (enable: boolean) => void;
    handleToggleOpenPlayerOnLaunch: (enable: boolean) => void;
    handleToggleMediaCache: (enable: boolean) => void;
    handleSetBackgroundOpacity: (opacity: number) => void;
    handleSetSubtitleOverlayOpacity: (opacity: number) => void;
    handleSetVisualizerOpacity: (opacity: number) => void;
    handleSetVisualizerBackgroundMode: (mode: VisualizerBackgroundMode) => void;
    handleResetVisualizerBackgroundMode: () => void;
    /** GPU helper crash recovery — force common without re-opting into interactive3d. */
    forceSafeVisualizerBackgroundAfterGpuCrash: () => void;
    handleAddUrlBackgroundItem: (item: UrlBackgroundItem) => void;
    handleUpdateUrlBackgroundItem: (id: string, patch: Partial<Omit<UrlBackgroundItem, 'id'>>) => void;
    handleDeleteUrlBackgroundItem: (id: string) => void;
    handleSetUrlBackgroundSelectedId: (id: string | null) => void;
    handleSetUrlBackgroundList: (items: UrlBackgroundItem[]) => void;
    handleSetVisualizerFrameRate: (frameRate: VisualizerFrameRate) => void;
    setDaylightPreference: (isDaylight: boolean) => void;
    handleSetVisualizerMode: (mode: VisualizerMode) => void;
    handleSetLyricWordMode: (mode: LyricWordMode) => void;
    handleSetLyricFontPresetId: (presetId: string) => void;
    handleSetVisualEffectIntensity: (intensity: LyricVisualEffectIntensity) => void;
    handleSetLyricEffectPackId: (packId: LyricEffectPackId) => void;
    handleSetClassicTuning: (patch: Partial<ClassicTuning>) => void;
    handleResetClassicTuning: () => void;
    handleSetCadenzaTuning: (patch: Partial<CadenzaTuning>) => void;
    handleResetCadenzaTuning: () => void;
    handleSetPartitaTuning: (patch: Partial<PartitaTuning>) => void;
    handleResetPartitaTuning: () => void;
    handleSetFumeTuning: (patch: Partial<FumeTuning>) => void;
    handleResetFumeTuning: () => void;
    handleSetCladdaghTuning: (patch: Partial<CladdaghTuning>) => void;
    handleResetCladdaghTuning: () => void;
    handleSetCappellaTuning: (patch: Partial<CappellaTuning>) => void;
    handleResetCappellaTuning: () => void;
    handleSetTiltTuning: (patch: Partial<TiltTuning>) => void;
    handleResetTiltTuning: () => void;
    handleSetPendoloTuning: (patch: Partial<PendoloTuning>) => void;
    handleResetPendoloTuning: () => void;
    handleSetMonetBackgroundTuning: (patch: Partial<MonetBackgroundTuning>) => void;
    handleResetMonetBackgroundTuning: () => void;
    handleSetLatentBackgroundTuning: (patch: Partial<LatentBackgroundTuning>) => void;
    handleResetLatentBackgroundTuning: () => void;
    handleSetInteractive3dSceneTuning: (patch: Partial<Interactive3dSceneTuning>) => void;
    /** Atomically enter interactive3d + apply 封面/滚筒/星河 (avoids mode/tuning race). */
    handleSelectInteractive3dVisualPreset: (preset: MineradioVisualPresetId) => void;
    handleResetInteractive3dSceneTuning: () => void;
    handleSetMonetTuning: (patch: Partial<MonetTuning>) => void;
    handleResetMonetTuning: () => void;
    handleUploadMonetBackgroundImage: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    handleClearMonetBackgroundImage: () => Promise<void>;
    handleUploadMonetPortraitImage: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    handleClearMonetPortraitImage: () => Promise<void>;
    handleImportCustomCappellaEmojiPack: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    handleClearCustomCappellaEmojiPack: () => Promise<void>;
    handleImportCustomCappellaAvatar: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    handleClearCustomCappellaAvatar: () => Promise<void>;
    handleSetLyricsFontStyle: (fontStyle: Theme['fontStyle']) => void;
    handleSetLyricsFontScale: (fontScale: number) => void;
    handleSetLyricsCustomFont: (font: StoredCustomLyricsFont | null) => void;
    handleUploadLyricsCustomFont: (file: File) => Promise<{ ok: boolean; error?: string; }>;
    handleSetAppLanguagePreference: (preference: AppLanguagePreference) => Promise<void>;
    handleSetLyricFilterPattern: (pattern: string) => void;
    handleToggleOpenPanelCloseButton: (enable: boolean) => void;
    handleToggleNowPlayingStage: (enable: boolean) => void;
    handleSetQueueAddBehavior: (behavior: QueueAddBehavior) => void;
    handleSetLocalBeatAnalysisMode: (mode: LocalBeatAnalysisMode) => void;
    handleSetLocalBeatAnalysisPromptPolicy: (policy: LocalBeatAnalysisPromptPolicy) => void;
    handleSetAudioOutputDeviceId: (deviceId: string) => void;
    handleSetVolume: (val: number) => void;
    handleToggleMute: () => void;
    handleToggleLoopMode: () => void;
    handleSetGridViewCardLayout: (layout: GridViewCardLayout) => void;
    handleTogglePlayerLyricsVisible: (visible: boolean) => void;
    handleSetHomeLayoutStyle: (style: 'carousel' | 'grid') => void;
    handleSetGrid3dCardStyle: (style: 'image' | 'card') => void;
};
