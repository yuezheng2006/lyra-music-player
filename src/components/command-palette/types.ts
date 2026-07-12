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
    shuffleQueue: () => void;
    playQueue: SongResult[];
    playSong: (song: SongResult, queue?: SongResult[]) => void | Promise<void>;
    canGenerateAITheme: boolean;
    isGeneratingTheme: boolean;
    generateAITheme: () => void;
    setVisualizerMode: (mode: VisualizerMode) => void;
    setLyricWordMode: (mode: LyricWordMode) => void;
    setVisualizerBackgroundMode: (mode: VisualizerBackgroundMode) => void;
    setMonetBackgroundTuning: (patch: Partial<MonetBackgroundTuning>) => void;
    toggleTransparentBackground: () => void;
    hideBottomSubtitleOverlay: boolean;
    toggleBottomSubtitleOverlay: () => void;
    showSubtitleTranslation: boolean;
    toggleSubtitleTranslation: () => void;
    toggleDaylightMode: () => void;
    enableSmartAtmosphere: boolean;
    toggleSmartAtmosphere: () => void;
    setAppLanguagePreference: (preference: AppLanguagePreference) => Promise<void> | void;
    enableAlternativeLyricSources: boolean;
    runAutoMatchBestLyric: () => Promise<boolean>;
    setIsUserGuideModalOpen: (isOpen: boolean) => void;
    openThemeQuickEditor: () => void;
    canOpenThemeQuickEditor: boolean;
    toggleDesktopLyrics: () => Promise<boolean>;
    setDesktopLyricsLocked: (locked: boolean) => Promise<boolean>;
    desktopLyricsEnabled: boolean;
    desktopLyricsLocked: boolean;
};
