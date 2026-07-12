import type React from 'react';
import type { MotionValue } from 'framer-motion';
import type FloatingPlayerControls from '../../FloatingPlayerControls';
import type SearchResultsOverlay from '../../SearchResultsOverlay';
import type DevDebugOverlay from '../../DevDebugOverlay';
import type PlaylistView from '../views/PlaylistView';
import type AlbumView from '../views/AlbumView';
import type ArtistView from '../views/ArtistView';
import { PlayerState } from '../../../types';
import type {
    Interactive3dSceneTuning,
    LyricData,
    MineradioVisualPresetId,
    SongResult,
    UnifiedSong,
    VisualizerBackgroundMode,
    VisualizerMode,
} from '../../../types';
import type { LyricColorPresetId } from '../../../utils/theme/lyricColorPresets';

// src/components/app/overlays/buildAppOverlaysModel.ts

type SearchOverlayProps = React.ComponentProps<typeof SearchResultsOverlay>;
type FloatingControlsProps = React.ComponentProps<typeof FloatingPlayerControls>;
type DebugOverlayProps = React.ComponentProps<typeof DevDebugOverlay>;
type PlaylistOverlayProps = React.ComponentProps<typeof PlaylistView>;
type AlbumOverlayProps = React.ComponentProps<typeof AlbumView>;
type ArtistOverlayProps = React.ComponentProps<typeof ArtistView>;

export type AppOverlaysModel = {
    searchOverlay?: SearchOverlayProps | null;
    detailOverlay?: (
        | { type: 'playlist'; props: PlaylistOverlayProps }
        | { type: 'album'; props: AlbumOverlayProps }
        | { type: 'artist'; props: ArtistOverlayProps }
    ) | null;
    debugOverlay?: DebugOverlayProps | null;
    floatingControls?: FloatingControlsProps | null;
};

type BuildAppOverlaysModelParams = {
    currentView: FloatingControlsProps['currentView'];
    isOverlayVisible: boolean;
    isSearchOpen: boolean;
    topOverlay: any;
    overlayStack: any[];
    theme: any;
    isDaylight: boolean;
    closeSearchView: () => void;
    handleSearchOverlaySubmit: (query?: string) => Promise<void>;
    handleSearchLoadMore: () => Promise<void>;
    handleSearchResultPlay: (track: UnifiedSong) => void;
    handleSearchResultArtistSelect: (track: UnifiedSong, artistName: string, artistId?: number) => void;
    handleSearchResultAlbumSelect: (track: UnifiedSong, albumName: string, albumId?: number) => void;
    popOverlay: () => void;
    playSong: (
        song: SongResult,
        queue?: SongResult[],
        isFmCall?: boolean,
        options?: { shouldNavigateToPlayer?: boolean },
    ) => Promise<void>;
    playOnlineQueueFromStart: (
        songs: SongResult[],
        options?: { shouldNavigateToPlayer?: boolean },
    ) => void;
    addNeteaseSongsToQueue: (songs: SongResult[]) => void;
    addNeteaseSongToQueue: (song: SongResult) => void;
    handleAlbumSelect: (albumId: number) => void;
    handleArtistSelect: (artistId: number) => void;
    userId?: number;
    playlists: Array<{ id: number }>;
    refreshUserData: () => Promise<unknown>;
    isDev: boolean;
    isDevDebugOverlayVisible: boolean;
    devDebugSnapshot: any;
    currentTime: MotionValue<number>;
    lyricCurrentTime: MotionValue<number>;
    currentSong: SongResult | null;
    playerState: PlayerState;
    duration: number;
    effectiveLoopMode: 'off' | 'all' | 'one';
    playerLyricsVisible: boolean;
    playQueueLength: number;
    playQueue: SongResult[];
    audioSrc: string | null;
    canToggleCurrentPlayback: boolean;
    isNowPlayingControlDisabled: boolean;
    lyrics: LyricData | null;
    activePlaybackContext: 'main' | 'stage';
    stageActiveEntryKind: string | null;
    syncStageLyricsClock: (timeSec: number, endTimeSec: number, nextPlayerState: PlayerState, startTimeSec?: number) => void;
    stageLyricsClockRef: React.MutableRefObject<{ startTimeSec: number }>;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    togglePlay: FloatingControlsProps['onTogglePlay'];
    toggleLoop: FloatingControlsProps['onToggleLoop'];
    onPrevTrack: () => void;
    onNextTrack: () => void;
    onTogglePlayerLyricsVisible: () => void;
    navigateToPlayer: () => void;
    navigateToHome: () => void;
    isPlayerChromeHidden: boolean;
    isFloatingDockRevealed?: boolean;
    isFloatingDockPopoverOpen?: boolean;
    onDockPopoverOpenChange?: (open: boolean) => void;
    shouldHidePlayerProgressBar: boolean;
    onSeekMainAudio: (time: number) => void;
    onStagePlayerSeek: () => Promise<unknown>;
    noTrackText: string;
    showLyricsLabel: string;
    hideLyricsLabel: string;
    listeningModeLabel: string;
    queueLabel?: string;
    previousTrackLabel?: string;
    nextTrackLabel?: string;
    playLabel?: string;
    pauseLabel?: string;
    loopOffLabel?: string;
    loopListLabel?: string;
    loopOneLabel?: string;
    isImmersiveFullscreen?: boolean;
    onToggleImmersiveFullscreen?: () => void;
    enterFullscreenLabel?: string;
    exitFullscreenLabel?: string;
    onRevealLyricsInPlayer?: () => void;
    coverUrl?: string | null;
    audioQuality?: 'exhigh' | 'lossless' | 'hires';
    onAudioQualityChange?: (quality: 'exhigh' | 'lossless' | 'hires') => void;
    canChangeAudioQuality?: boolean;
    qualityExhighLabel?: string;
    qualityLosslessLabel?: string;
    qualityHiresLabel?: string;
    audioQualityLabel?: string;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    interactive3dSceneTuning?: Interactive3dSceneTuning | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    visualizerMode?: VisualizerMode;
    onVisualizerModeChange?: (mode: VisualizerMode) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    backgroundMenuLabel?: string;
    backgroundModeInteractive3dLabel?: string;
    backgroundModeCommonLabel?: string;
    backgroundModeMonetLabel?: string;
    backgroundPresetSectionLabel?: string;
    lyricsStyleSectionLabel?: string;
    lyricColorSectionLabel?: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
};

// Builds the full overlay model, including detail overlays and floating playback controls.
export const buildAppOverlaysModel = ({
    currentView,
    isOverlayVisible,
    isSearchOpen,
    topOverlay,
    overlayStack,
    theme,
    isDaylight,
    closeSearchView,
    handleSearchOverlaySubmit,
    handleSearchLoadMore,
    handleSearchResultPlay,
    handleSearchResultArtistSelect,
    handleSearchResultAlbumSelect,
    popOverlay,
    playSong,
    playOnlineQueueFromStart,
    addNeteaseSongsToQueue,
    addNeteaseSongToQueue,
    handleAlbumSelect,
    handleArtistSelect,
    userId,
    playlists,
    refreshUserData,
    isDev,
    isDevDebugOverlayVisible,
    devDebugSnapshot,
    currentTime,
    lyricCurrentTime,
    currentSong,
    playerState,
    duration,
    effectiveLoopMode,
    playerLyricsVisible,
    playQueueLength,
    playQueue,
    audioSrc,
    canToggleCurrentPlayback,
    isNowPlayingControlDisabled,
    lyrics,
    activePlaybackContext,
    stageActiveEntryKind,
    syncStageLyricsClock,
    stageLyricsClockRef,
    setPlayerState,
    togglePlay,
    toggleLoop,
    onPrevTrack,
    onNextTrack,
    onTogglePlayerLyricsVisible,
    navigateToPlayer,
    navigateToHome,
    isPlayerChromeHidden,
    isFloatingDockRevealed = false,
    isFloatingDockPopoverOpen = false,
    onDockPopoverOpenChange,
    shouldHidePlayerProgressBar,
    onSeekMainAudio,
    onStagePlayerSeek,
    noTrackText,
    showLyricsLabel,
    hideLyricsLabel,
    listeningModeLabel,
    queueLabel = 'Playlist',
    previousTrackLabel = 'Previous track',
    nextTrackLabel = 'Next track',
    playLabel = 'Play',
    pauseLabel = 'Pause',
    loopOffLabel = 'Loop: off',
    loopListLabel = 'Loop: list',
    loopOneLabel = 'Loop: one',
    isImmersiveFullscreen = false,
    onToggleImmersiveFullscreen,
    enterFullscreenLabel,
    exitFullscreenLabel,
    onRevealLyricsInPlayer,
    coverUrl,
    audioQuality,
    onAudioQualityChange,
    canChangeAudioQuality,
    qualityExhighLabel,
    qualityLosslessLabel,
    qualityHiresLabel,
    audioQualityLabel,
    visualizerBackgroundMode = null,
    interactive3dSceneTuning = null,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    visualizerMode = 'classic',
    onVisualizerModeChange,
    onApplyLyricColorPreset,
    backgroundMenuLabel,
    backgroundModeInteractive3dLabel,
    backgroundModeCommonLabel,
    backgroundModeMonetLabel,
    backgroundPresetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    getBackgroundPresetLabel,
    getVisualizerModeLabel,
}: BuildAppOverlaysModelParams): AppOverlaysModel => ({
    searchOverlay: currentView === 'home'
        ? {
            theme,
            isDaylight,
            onClose: closeSearchView,
            onSubmitSearch: handleSearchOverlaySubmit,
            onLoadMore: handleSearchLoadMore,
            onPlayTrack: handleSearchResultPlay,
            onAddSongToQueue: addNeteaseSongToQueue,
            onSelectArtist: handleSearchResultArtistSelect,
            onSelectAlbum: handleSearchResultAlbumSelect,
        }
        : null,
    detailOverlay: isOverlayVisible && topOverlay
        ? (topOverlay.type === 'playlist'
            ? {
                type: 'playlist' as const,
                props: {
                    playlist: topOverlay.playlist,
                    onBack: popOverlay,
                    onPlaySong: (song, ctx) => {
                        void playSong(song, ctx, false, { shouldNavigateToPlayer: true });
                    },
                    onPlayAll: songs => {
                        playOnlineQueueFromStart(songs, { shouldNavigateToPlayer: false });
                    },
                    onAddAllToQueue: addNeteaseSongsToQueue,
                    onAddSongToQueue: addNeteaseSongToQueue,
                    onSelectAlbum: handleAlbumSelect,
                    onSelectArtist: handleArtistSelect,
                    currentUserId: userId,
                    isLikedSongsPlaylist: playlists[0]?.id === topOverlay.playlist.id,
                    onPlaylistMutated: async () => {
                        await refreshUserData();
                    },
                    theme,
                    isDaylight,
                },
            }
            : topOverlay.type === 'album'
                ? {
                    type: 'album' as const,
                    props: {
                        albumId: topOverlay.id,
                        onBack: popOverlay,
                        onPlaySong: (song, ctx) => {
                            void playSong(song, ctx, false, { shouldNavigateToPlayer: true });
                        },
                        onPlayAll: songs => {
                            playOnlineQueueFromStart(songs, { shouldNavigateToPlayer: false });
                        },
                        onAddAllToQueue: addNeteaseSongsToQueue,
                        onAddSongToQueue: addNeteaseSongToQueue,
                        onSelectArtist: handleArtistSelect,
                        theme,
                        isDaylight,
                    },
                }
                : {
                    type: 'artist' as const,
                    props: {
                        artistId: topOverlay.id,
                        onBack: popOverlay,
                        onPlaySong: (song, ctx) => {
                            void playSong(song, ctx, false, { shouldNavigateToPlayer: true });
                        },
                        onAddSongToQueue: addNeteaseSongToQueue,
                        onSelectAlbum: handleAlbumSelect,
                        theme,
                        isDaylight,
                    },
                })
        : null,
    debugOverlay: isDev && currentView === 'player' && isDevDebugOverlayVisible
        ? {
            snapshot: devDebugSnapshot,
            currentTime,
            lyricCurrentTime,
            isDaylight,
        }
        : null,
    floatingControls: currentSong
        ? {
            currentSong,
            playerState,
            currentTime,
            lyricCurrentTime,
            duration,
            loopMode: effectiveLoopMode,
            playerLyricsVisible,
            currentView,
            audioSrc,
            canTogglePlay: canToggleCurrentPlayback,
            canSkipTracks: Boolean(currentSong && playQueueLength > 1),
            controlsDisabled: isNowPlayingControlDisabled,
            lyrics,
            onSeek: (time) => {
                if (isNowPlayingControlDisabled) {
                    return;
                }

                if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
                    syncStageLyricsClock(time, duration, playerState, stageLyricsClockRef.current.startTimeSec);
                    currentTime.set(time);
                    if (playerState !== PlayerState.PLAYING) {
                        setPlayerState(PlayerState.PLAYING);
                    }
                    void onStagePlayerSeek();
                } else {
                    onSeekMainAudio(time);
                }
            },
            onTogglePlay: togglePlay,
            onToggleLoop: toggleLoop,
            onPrevTrack,
            onNextTrack,
            onTogglePlayerLyricsVisible,
            onNavigateToPlayer: navigateToPlayer,
            onNavigateToHome: navigateToHome,
            noTrackText,
            showLyricsLabel,
            hideLyricsLabel,
            listeningModeLabel,
            previousTrackLabel,
            nextTrackLabel,
            playLabel,
            pauseLabel,
            loopOffLabel,
            loopListLabel,
            loopOneLabel,
            playQueue,
            onPlayQueueSong: (song, queue) => {
                return playSong(song, queue, false, { shouldNavigateToPlayer: false });
            },
            queueLabel,
            isImmersiveFullscreen,
            onToggleImmersiveFullscreen,
            enterFullscreenLabel,
            exitFullscreenLabel,
            onRevealLyricsInPlayer,
            coverUrl,
            primaryColor: 'var(--text-primary)',
            secondaryColor: 'var(--text-secondary)',
            theme,
            isDaylight,
            isHidden: currentView === 'player'
                && isPlayerChromeHidden
                && !isFloatingDockRevealed
                && !isFloatingDockPopoverOpen,
            hideControlBar: shouldHidePlayerProgressBar,
            audioQuality,
            onAudioQualityChange,
            canChangeAudioQuality,
            qualityExhighLabel,
            qualityLosslessLabel,
            qualityHiresLabel,
            audioQualityLabel,
            visualizerBackgroundMode,
            interactive3dSceneTuning,
            onVisualizerBackgroundModeChange,
            onInteractive3dSceneTuningChange,
            visualizerMode,
            onVisualizerModeChange,
            onApplyLyricColorPreset,
            onDockPopoverOpenChange,
            backgroundMenuLabel,
            backgroundModeInteractive3dLabel,
            backgroundModeCommonLabel,
            backgroundModeMonetLabel,
            backgroundPresetSectionLabel,
            lyricsStyleSectionLabel,
            lyricColorSectionLabel,
            getBackgroundPresetLabel,
            getVisualizerModeLabel,
        }
        : null,
});
