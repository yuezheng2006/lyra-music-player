import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { useShallow } from 'zustand/react/shallow';
import {
    SongResult,
    NeteaseUser,
    NeteasePlaylist,
    LocalSong,
    LocalPlaylist,
    LocalLibraryGroup,
    Theme,
    OnlineMusicProviderId,
} from '../types';
import OnlineHomeFlatSurface from './folia-grid/OnlineHomeFlatSurface';
import { createOnlinePlaylistGridViewCollection } from './app/home/gridViewCollectionAdapters';
import {
    HOME_CONTENT_TOP_PADDING_CLASS,
    HOME_HEADER_BOTTOM_PADDING_CLASS,
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeSolidBackgroundClass,
} from './app/home/homeSurfaceStyles';
import HomeDiscoveryRail from './app/home/HomeDiscoveryRail';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import { hasNeteaseSession, hasQQMusicSession } from '../utils/onlineLibraryAccess';
import { resolvePeerDefaultDescription, resolvePeerDefaultDisplayName, resolveProviderDefaultChannel } from '../utils/onlineDefaultPlaylists';
import { isCuratedPeerFreeProviderId } from '../utils/onlinePeerProviders';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';

// src/components/Grid3D.tsx
// Peer-provider flat home with sectional playlist grids.

interface Grid3DProps {
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
    onBackToPlayer: () => void;
    onRefreshUser: () => void;
    user: NeteaseUser | null;
    playlists: NeteasePlaylist[];
    cloudPlaylist?: NeteasePlaylist | null;
    favoriteAlbums?: any[];
    isFavoriteAlbumsLoading?: boolean;
    favoriteAlbumsLoadFailed?: boolean;
    currentTrack?: SongResult | null;
    isPlaying: boolean;
    onSelectPlaylist: (playlist: NeteasePlaylist) => void;
    onSelectAlbum: (albumId: number) => void;
    onSelectArtist: (artistId: number) => void;
    onSelectLocalAlbum?: (albumName: string) => void;
    onSelectLocalArtist?: (artistName: string) => void;
    localSongs: LocalSong[];
    localPlaylists: LocalPlaylist[];
    onRefreshLocalSongs: () => void;
    onPlayLocalSong: (song: LocalSong, queue?: LocalSong[]) => void;
    onAddLocalSongToQueue?: (song: LocalSong) => void;
    localMusicState: {
        activeRow: 0 | 1 | 2 | 3;
        selectedGroup: LocalLibraryGroup | null;
        detailStack: LocalLibraryGroup[];
        detailOriginView: 'home' | 'player' | null;
        focusedFolderIndex: number;
        focusedAlbumIndex: number;
        focusedArtistIndex: number;
        focusedPlaylistIndex: number;
    };
    setLocalMusicState: React.Dispatch<React.SetStateAction<{
        activeRow: 0 | 1 | 2 | 3;
        selectedGroup: LocalLibraryGroup | null;
        detailStack: LocalLibraryGroup[];
        detailOriginView: 'home' | 'player' | null;
        focusedFolderIndex: number;
        focusedAlbumIndex: number;
        focusedArtistIndex: number;
        focusedPlaylistIndex: number;
    }>>;
    onMatchSong?: (song: LocalSong) => void;
    onPlayNavidromeSong?: (song: any, queue?: any[]) => void;
    onAddNavidromeSongsToQueue?: (songs: any[]) => void;
    onMatchNavidromeSong?: (song: any) => void;
    navidromeFocusedAlbumIndex?: number;
    setNavidromeFocusedAlbumIndex?: (index: number) => void;
    pendingNavidromeSelection?: any;
    onPendingNavidromeSelectionHandled?: () => void;
    onSearchCommitted: (query: string, sourceTab: any, replace?: boolean) => void;
    theme: Theme;
    navidromeEnabled?: boolean;
    onPlayAll?: (songs: SongResult[]) => void;
    onAddAllToQueue?: (songs: SongResult[]) => void;
    onAddSongToQueue?: (song: SongResult) => void;
    onOpenGridView?: (collection: any) => void;
    stageEnabled?: boolean;
    stageIsActive?: boolean;
    onOpenStagePlayer?: () => void;
}

const resolvePlaylistProvider = (playlist: NeteasePlaylist): OnlineMusicProviderId => {
    if (
        playlist.musicProvider === 'qq'
        || playlist.musicProvider === 'qishui'
        || playlist.musicProvider === 'coco'
        || playlist.musicProvider === 'kugou'
        || playlist.musicProvider === 'bilibili'
        || playlist.musicProvider === 'kuwo'
    ) {
        return playlist.musicProvider;
    }
    return 'netease';
};

export const Grid3D: React.FC<Grid3DProps> = (props) => {
    const {
        onPlaySong,
        onRefreshUser,
        user,
        playlists,
        currentTrack,
        onOpenGridView,
        stageEnabled = false,
        stageIsActive = false,
        onOpenStagePlayer,
    } = props;

    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const moduleFilter = useOnlineLibraryFilterStore(state => state.moduleFilter);
    const setSearchProvider = useOnlineLibraryFilterStore(state => state.setSearchProvider);
    const {
        restoreSearch,
        openPeerSearchChannel,
    } = useSearchNavigationStore(useShallow(state => ({
        restoreSearch: state.restoreSearch,
        openPeerSearchChannel: state.openPeerSearchChannel,
    })));
    const hasNeteaseLogin = hasNeteaseSession(user);
    const hasQQLogin = hasQQMusicSession();

    const playlistCards = useMemo(() => playlists.map(p => ({
        id: p.id,
        name: p.specialType === 'provider-default'
            ? resolvePeerDefaultDisplayName(p.musicProvider, t)
            : p.name,
        coverUrl: p.coverImgUrl || (p as any).coverUrl,
        trackCount: p.trackCount,
        playCount: p.playCount,
        musicProvider: resolvePlaylistProvider(p),
        description: p.specialType === 'cloud'
            ? t('home.cloud')
            : p.specialType === 'provider-default'
                ? resolvePeerDefaultDescription(p.musicProvider, t)
                : (p.creator?.nickname || t('home.playlists')),
        raw: p,
    })), [playlists, t]);

    const openSearchChannel = (provider: OnlineLibraryProviderId) => {
        setSearchProvider(provider);
        if (isCuratedPeerFreeProviderId(provider)) {
            openPeerSearchChannel({
                sourceTab: provider,
                returnView: 'home',
            });
            return;
        }
        // Open-mode plugins and login providers share the independent empty-entry path.
        restoreSearch({
            query: '',
            sourceTab: provider,
            returnView: 'home',
        });
    };

    const handleSelectCollectionCard = (card: { raw: NeteasePlaylist }) => {
        const playlist = card.raw;
        const peerChannel = resolveProviderDefaultChannel(playlist);
        if (peerChannel) {
            openSearchChannel(peerChannel);
            return;
        }
        onOpenGridView?.(createOnlinePlaylistGridViewCollection(playlist));
    };

    const mainBg = resolveHomeSolidBackgroundClass(isDaylight);
    const navPillBg = isDaylight ? 'bg-black/5' : 'bg-white/10';
    const navPillInactiveText = isDaylight ? 'text-black/60 hover:text-black' : 'text-white/60 hover:text-white';

    return (
        <div className={`relative w-full h-full flex flex-col font-sans overflow-hidden ${mainBg} pointer-events-auto`} style={{ color: 'var(--text-primary)' }}>
            <div className={`w-full max-w-7xl mx-auto z-20 relative shrink-0 px-4 md:px-6 ${HOME_HEADER_TOP_PADDING_CLASS} ${HOME_HEADER_BOTTOM_PADDING_CLASS}`}>
                {stageEnabled ? (
                    <div className="flex justify-center">
                        <button
                            onClick={() => onOpenStagePlayer?.()}
                            data-stage-active={stageIsActive ? 'true' : 'false'}
                            className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${navPillBg} ${navPillInactiveText}`}
                        >
                            <span className="relative z-10">{t('home.stage') || '舞台'}</span>
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex min-h-full flex-col">
                    <HomeDiscoveryRail
                        isDaylight={isDaylight}
                        user={user}
                        playlists={playlists}
                        hasFloatingPlayer={Boolean(currentTrack)}
                        onPlaySong={onPlaySong}
                        onSelectPlaylist={props.onSelectPlaylist}
                        onRefreshUser={onRefreshUser}
                    />

                    {hasNeteaseLogin || hasQQLogin ? (
                        <div className={`relative ${HOME_CONTENT_TOP_PADDING_CLASS}`}>
                            <OnlineHomeFlatSurface
                                items={playlistCards}
                                isDaylight={isDaylight}
                                hasFloatingPlayer={Boolean(currentTrack)}
                                hasPersonalAccount={hasNeteaseLogin || hasQQLogin}
                                user={user}
                                moduleFilter={moduleFilter}
                                onSelectPlaylist={handleSelectCollectionCard}
                                onRefreshUser={onRefreshUser}
                                emptyMessage={playlistCards.length === 0
                                    ? t('home.noFilteredPlaylists')
                                    : t('home.loadingLibrary')}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default Grid3D;
