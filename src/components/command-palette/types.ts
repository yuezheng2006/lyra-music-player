import type React from 'react';
import type { SearchReturnView } from '../../stores/useSearchNavigationStore';
import type { HomeViewTab, LocalSong, LyricWordMode, PlayerState, SearchSourceId, SongResult, VisualizerMode, VisualizerBackgroundMode, MonetBackgroundTuning } from '../../types';
import type { AppLanguagePreference } from '../../i18n/config';
import type { PanelTab } from '../UnifiedPanel';
import type { SettingsModalInitialTab, SettingsSubviewId } from '../../stores/useSettingsUiStore';

// src/components/command-palette/types.ts
// Shared command palette contracts used by the registry, hook, and UI shell.

export type CommandPaletteGroup = 'search' | 'settings' | 'navigation' | 'panel' | 'playback' | 'visualizer';

export type CommandPaletteSearchSource = SearchSourceId;

export type CommandPaletteCommand = {
    id: string;
    group: CommandPaletteGroup;
    title: string;
    description: string;
    keywords: string[];
    placeholder?: string;
    requiresInput?: boolean;
    getPreview?: (input: string, context: CommandPaletteContext) => string | null;
    execute: (input: string, context: CommandPaletteContext) => Promise<boolean> | boolean;
};

export type CommandPaletteMatch = {
    command: CommandPaletteCommand;
    score: number;
    input: string;
    previewText?: string | null;
};

export type CommandPaletteContext = {
    currentSearchSourceTab: SearchSourceId;
    localSongs: LocalSong[];
    playerState: PlayerState;
    t: (key: string, fallback?: string) => string;
    openSettings: (initialTab?: SettingsModalInitialTab, initialSubview?: SettingsSubviewId | null) => void;
    navigateToHome: () => void;
    navigateDirectHome: (options?: { clearContext?: boolean }) => void;
    navigateToPlayer: () => void;
    navigateToSearch: (args: { query: string; sourceTab: SearchSourceId; replace?: boolean; returnView?: SearchReturnView; }) => void;
    toggleImmersiveFullscreen: () => boolean;
    setHomeViewTab: (tab: HomeViewTab) => void;
    setPanelTab: (tab: PanelTab) => void;
    setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    submitSearch: (args: {
        query?: string;
        sourceTab: SearchSourceId;
        deps: {
            localSongs: LocalSong[];
            t: (key: string, fallback?: string) => string;
        };
        returnView?: SearchReturnView;
    }) => Promise<boolean>;
    togglePlay: () => void;
    toggleLoop: () => void;
    handleNextTrack: () => void;
    handlePrevTrack: () => void;
    /** Adjust volume by a relative step (e.g. ±0.05); may unmute on step-up. */
    adjustVolumeByStep: (delta: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    shuffleQueue: () => void;
    playQueue: SongResult[];
    currentSong: SongResult | null;
    replacePlayQueue: (nextQueue: SongResult[], toastText?: string) => boolean;
    playSong: (song: SongResult, queue?: SongResult[]) => void | Promise<void>;
    startNeteasePersonalFm: () => Promise<boolean>;
    startNeteaseHeartbeat: () => Promise<boolean>;
    canGenerateAITheme: boolean;
    isGeneratingTheme: boolean;
    generateAITheme: () => void;
    setVisualizerMode: (mode: VisualizerMode) => void;
    setLyricWordMode: (mode: LyricWordMode) => void;
    setLyricEffectPackId: (packId: import('../../utils/lyricEffectPacks').LyricEffectPackId) => void;
    setVisualizerBackgroundMode: (mode: VisualizerBackgroundMode) => void;
    setMonetBackgroundTuning: (patch: Partial<MonetBackgroundTuning>) => void;
    setLatentBackgroundTuning: (patch: Partial<import('../../types').LatentBackgroundTuning>) => void;
    setNomandBackgroundTuning: (patch: Partial<import('../../types').NomandBackgroundTuning>) => void;
    toggleTransparentBackground: () => void;
    hideBottomSubtitleOverlay: boolean;
    toggleBottomSubtitleOverlay: () => void;
    showSubtitleTranslation: boolean;
    toggleSubtitleTranslation: () => void;
    subtitleContentMode: import('../../types').SubtitleContentMode;
    cycleSubtitleContentMode: () => void;
    toggleDaylightMode: () => void;
    enableSmartAtmosphere: boolean;
    toggleSmartAtmosphere: () => void;
    /** Open local beat-analysis confirm modal for the current local/blob track. */
    openLocalBeatAnalysis: () => boolean;
    /** Global cinema/pulse mode for local offline beat analysis (Settings → Playback). */
    setLocalBeatAnalysisMode: (mode: 'mr' | 'dj') => void;
    /** auto = silent background analysis; ask = show confirm dialog on local tracks. */
    setLocalBeatAnalysisPromptPolicy: (policy: 'auto' | 'ask') => void;
    enableBilibiliVideoBackground: boolean;
    toggleBilibiliVideoBackground: () => void;
    setAppLanguagePreference: (preference: AppLanguagePreference) => Promise<void> | void;
    enableAlternativeLyricSources: boolean;
    runAutoMatchBestLyric: () => Promise<boolean>;
    setIsUserGuideModalOpen: (isOpen: boolean) => void;
    setIsShortcutsCheatSheetOpen: (isOpen: boolean) => void;
    setIsOnboardingOpen: (isOpen: boolean) => void;
    setIsWhatsNewOpen: (isOpen: boolean) => void;
    openThemeQuickEditor: () => void;
    canOpenThemeQuickEditor: boolean;
    toggleDesktopLyrics: () => Promise<boolean>;
    setDesktopLyricsLocked: (locked: boolean) => Promise<boolean>;
    desktopLyricsEnabled: boolean;
    desktopLyricsLocked: boolean;
    setDesktopLyricsYFactor: (factor: number) => void;
    downloadCurrentSong: () => Promise<boolean>;
    downloadSearchResults: () => Promise<boolean>;
    startVideoExport: (startMode?: import('../../types/videoExport').VideoExportStartMode) => void;
    isElectronWindow: boolean;
};
