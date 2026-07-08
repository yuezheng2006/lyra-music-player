import { useEffect } from 'react';
import type { RefObject, MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { MotionValue } from 'framer-motion';
import type { TFunction } from 'i18next';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useNeteaseLibrary } from '@/hooks/useNeteaseLibrary';
import { useElectronWindowPlaybackHandoff } from '@/hooks/useElectronWindowPlaybackHandoff';
import { useStagePlaybackController } from '@/hooks/useStagePlaybackController';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerState, PlaybackContext, SongResult, LyricData, StatusMessage } from '@/types';
import type { ThemeCacheSongKey } from '@/services/themeCache';

// 导航、曲库同步、舞台播放与 Electron 窗口交接等跨模块集成
export type AppControllerCoreIntegrationsParams = {
    t: TFunction;
    isDev: boolean;
    isElectronWindow: boolean;
    setStatusMsg: (msg: StatusMessage | null) => void;
    enableNowPlayingStage: boolean;
    activePlaybackContext: PlaybackContext;
    setActivePlaybackContext: (context: PlaybackContext) => void;
    currentSong: SongResult | null;
    lyrics: LyricData | null;
    cachedCoverUrl: string | null;
    audioSrc: string | null;
    playQueue: SongResult[];
    isFmMode: boolean;
    playerState: PlayerState;
    duration: number;
    currentLineIndex: number;
    currentTime: MotionValue<number>;
    audioRef: RefObject<HTMLAudioElement | null>;
    currentSongRef: MutableRefObject<number | null>;
    shouldAutoPlayRef: MutableRefObject<boolean>;
    pendingResumeTimeRef: MutableRefObject<number | null>;
    lastAudioRecoverySourceRef: MutableRefObject<string | null>;
    currentOnlineAudioUrlFetchedAtRef: MutableRefObject<number | null>;
    setCurrentSong: (song: SongResult | null) => void;
    setLyrics: (lyrics: LyricData | null) => void;
    setCachedCoverUrl: (url: string | null) => void;
    setAudioSrc: (src: string | null) => void;
    setPlayQueue: Dispatch<SetStateAction<SongResult[]>>;
    setIsFmMode: (value: boolean) => void;
    setIsLyricsLoading: (value: boolean) => void;
    setPlayerState: (state: PlayerState) => void;
    setCurrentLineIndex: (index: number) => void;
    setDuration: (duration: number) => void;
    audioQuality: string;
    isPanelOpen: boolean;
    setIsPanelOpen: (open: boolean) => void;
    blobUrlRef: MutableRefObject<string | null>;
    isPlayerChromeHidden: boolean;
    setIsPlayerChromeHidden: (hidden: boolean) => void;
    showTransparentWindowBorder: boolean;
    setShowTransparentWindowBorder: (visible: boolean) => void;
    transparentPlayerBackground: boolean;
    applyTransparentPlayerBackground: (enabled: boolean) => void;
    restoreCachedThemeForSong: (
        songId: ThemeCacheSongKey,
        options?: { allowLastUsedFallback?: boolean; preserveCurrentOnMiss?: boolean },
    ) => Promise<unknown>;
    persistLastPlaybackCache: (song: SongResult | null, queue: SongResult[]) => Promise<void>;
};

export function useAppControllerCoreIntegrations(params: AppControllerCoreIntegrationsParams) {
    const {
        t,
        isDev,
        isElectronWindow,
        setStatusMsg,
        enableNowPlayingStage,
        activePlaybackContext,
        setActivePlaybackContext,
        currentSong,
        lyrics,
        cachedCoverUrl,
        audioSrc,
        playQueue,
        isFmMode,
        playerState,
        duration,
        currentLineIndex,
        currentTime,
        audioRef,
        currentSongRef,
        shouldAutoPlayRef,
        pendingResumeTimeRef,
        lastAudioRecoverySourceRef,
        currentOnlineAudioUrlFetchedAtRef,
        setCurrentSong,
        setLyrics,
        setCachedCoverUrl,
        setAudioSrc,
        setPlayQueue,
        setIsFmMode,
        setIsLyricsLoading,
        setPlayerState,
        setCurrentLineIndex,
        setDuration,
        audioQuality,
        isPanelOpen,
        setIsPanelOpen,
        blobUrlRef,
        isPlayerChromeHidden,
        setIsPlayerChromeHidden,
        showTransparentWindowBorder,
        setShowTransparentWindowBorder,
        transparentPlayerBackground,
        applyTransparentPlayerBackground,
        restoreCachedThemeForSong,
        persistLastPlaybackCache,
    } = params;

    const {
        currentView,
        overlayStack,
        isOverlayVisible,
        topOverlay,
        hasOverlay,
        focusedPlaylistIndex,
        setFocusedPlaylistIndex,
        focusedFavoriteAlbumIndex,
        setFocusedFavoriteAlbumIndex,
        focusedRadioIndex,
        setFocusedRadioIndex,
        navidromeFocusedAlbumIndex,
        setNavidromeFocusedAlbumIndex,
        pendingNavidromeSelection,
        setPendingNavidromeSelection,
        localMusicState,
        setLocalMusicState,
        navigateToPlayer,
        navigateToHome,
        navigateDirectHome,
        navigateToSearch,
        closeSearchView,
        handlePlaylistSelect,
        handleAlbumSelect: navigateToNeteaseAlbum,
        handleArtistSelect: navigateToNeteaseArtist,
        popOverlay,
    } = useAppNavigation();

    useEffect(() => {
        if (currentView !== 'player' && isPanelOpen) {
            setIsPanelOpen(false);
        }
    }, [currentView, isPanelOpen, setIsPanelOpen]);

    const {
        isSearchOpen,
        searchQuery,
        searchSourceTab,
        submitSearch,
        loadMoreSearchResults,
    } = useSearchNavigationStore(useShallow(state => ({
        isSearchOpen: state.isSearchOpen,
        searchQuery: state.searchQuery,
        searchSourceTab: state.searchSourceTab,
        submitSearch: state.submitSearch,
        loadMoreSearchResults: state.loadMoreSearchResults,
    })));
    const hideSearchOverlay = useSearchNavigationStore(state => state.hideSearchOverlay);

    const {
        user,
        playlists,
        cloudPlaylist,
        likedSongIds,
        isSyncing,
        cacheSize,
        refreshUserData,
        updateCacheSize,
        handleClearCache,
        handleSyncData,
        handleLogout,
        setLikedSongIds,
    } = useNeteaseLibrary({
        currentView,
        hasOverlay,
        setStatusMsg,
        t,
    });

    const {
        stageStatus,
        setStageStatus,
        stageSource,
        stageActiveEntryKind,
        stageLyricsSession,
        stageMediaSession,
        nowPlayingConnectionStatus,
        nowPlayingTrack,
        nowPlayingLyricPayload,
        nowPlayingProgressMs,
        nowPlayingProgressQuality,
        nowPlayingPaused,
        nowPlayingDebugInfo,
        isNowPlayingStageActive,
        mainPlaybackSnapshotRef,
        stageLyricsClockRef,
        syncStageLyricsClock,
        getSyntheticStageLyricsTime,
        syncNowPlayingClock,
        getNowPlayingDisplayTime,
        loadStageSessionIntoPlayback,
        restoreStagePlaybackHandoff,
        clearPersistedStagePlaybackCache,
        clearStagePlaybackSession,
        openStagePlayer,
        leaveStagePlayback,
        interruptStagePlaybackForMainTransition,
    } = useStagePlaybackController({
        t: (key) => t(key),
        isDev,
        isElectronWindow,
        enableNowPlayingStage,
        activePlaybackContext,
        setActivePlaybackContext,
        currentSong,
        lyrics,
        cachedCoverUrl,
        audioSrc,
        playQueue,
        isFmMode,
        playerState,
        duration,
        currentLineIndex,
        currentTime,
        audioRef,
        currentSongRef,
        shouldAutoPlayRef,
        pendingResumeTimeRef,
        lastAudioRecoverySourceRef,
        currentOnlineAudioUrlFetchedAtRef,
        setCurrentSong,
        setLyrics,
        setCachedCoverUrl,
        setAudioSrc,
        setPlayQueue,
        setIsFmMode,
        setIsLyricsLoading,
        setPlayerState,
        setCurrentLineIndex,
        setDuration,
        setStatusMsg,
        navigateToPlayer,
    });

    const {
        restoreStatus: windowPlaybackHandoffRestoreStatus,
        toggleTransparentModeWithHandoff,
    } = useElectronWindowPlaybackHandoff({
        isElectronWindow,
        audioQuality,
        userId: user?.userId,
        activePlaybackContext,
        setActivePlaybackContext,
        currentView,
        navigateToPlayer,
        currentSong,
        lyrics,
        cachedCoverUrl,
        audioSrc,
        playQueue,
        isFmMode,
        playerState,
        duration,
        currentLineIndex,
        currentTime,
        audioRef,
        mainPlaybackSnapshotRef,
        stageStatus,
        stageSource,
        stageLyricsClockRef,
        nowPlayingTrack,
        nowPlayingLyricPayload,
        nowPlayingPaused,
        nowPlayingProgressMs,
        nowPlayingProgressQuality,
        getNowPlayingDisplayTime,
        restoreStagePlaybackHandoff,
        setCurrentSong,
        setLyrics,
        setCachedCoverUrl,
        setAudioSrc,
        setPlayQueue,
        setIsFmMode,
        setIsLyricsLoading,
        setPlayerState,
        setCurrentLineIndex,
        setDuration,
        setStatusMsg,
        blobUrlRef,
        shouldAutoPlayRef,
        pendingResumeTimeRef,
        lastAudioRecoverySourceRef,
        currentOnlineAudioUrlFetchedAtRef,
        isPlayerChromeHidden,
        setIsPlayerChromeHidden,
        showTransparentWindowBorder,
        setShowTransparentWindowBorder,
        transparentPlayerBackground,
        applyTransparentPlayerBackground,
        restoreCachedThemeForSong,
        persistLastPlaybackCache,
    });

    return {
        cacheSize,
        clearPersistedStagePlaybackCache,
        clearStagePlaybackSession,
        closeSearchView,
        cloudPlaylist,
        currentView,
        focusedFavoriteAlbumIndex,
        focusedPlaylistIndex,
        focusedRadioIndex,
        getNowPlayingDisplayTime,
        getSyntheticStageLyricsTime,
        handleAlbumSelect: navigateToNeteaseAlbum,
        handleArtistSelect: navigateToNeteaseArtist,
        handleClearCache,
        handleLogout,
        handlePlaylistSelect,
        handleSyncData,
        hasOverlay,
        hideSearchOverlay,
        interruptStagePlaybackForMainTransition,
        isNowPlayingStageActive,
        isOverlayVisible,
        isSearchOpen,
        isSyncing,
        leaveStagePlayback,
        likedSongIds,
        loadMoreSearchResults,
        loadStageSessionIntoPlayback,
        localMusicState,
        mainPlaybackSnapshotRef,
        navigateDirectHome,
        navigateToHome,
        navigateToNeteaseAlbum,
        navigateToNeteaseArtist,
        navigateToPlayer,
        navigateToSearch,
        navidromeFocusedAlbumIndex,
        nowPlayingConnectionStatus,
        nowPlayingDebugInfo,
        nowPlayingLyricPayload,
        nowPlayingPaused,
        nowPlayingProgressMs,
        nowPlayingProgressQuality,
        nowPlayingTrack,
        openStagePlayer,
        overlayStack,
        pendingNavidromeSelection,
        playlists,
        popOverlay,
        refreshUserData,
        searchQuery,
        searchSourceTab,
        setFocusedFavoriteAlbumIndex,
        setFocusedPlaylistIndex,
        setFocusedRadioIndex,
        setLikedSongIds,
        setLocalMusicState,
        setNavidromeFocusedAlbumIndex,
        setPendingNavidromeSelection,
        setStageStatus,
        stageActiveEntryKind,
        stageLyricsClockRef,
        stageLyricsSession,
        stageMediaSession,
        stageSource,
        stageStatus,
        submitSearch,
        syncNowPlayingClock,
        syncStageLyricsClock,
        toggleTransparentModeWithHandoff,
        topOverlay,
        updateCacheSize,
        user,
        windowPlaybackHandoffRestoreStatus,
    };
}
