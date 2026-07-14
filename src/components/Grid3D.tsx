import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';
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
    HOME_FILTER_BOTTOM_PADDING_CLASS,
    HOME_HEADER_BOTTOM_PADDING_CLASS,
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeSolidBackgroundClass,
} from './app/home/homeSurfaceStyles';
import OnlineProviderFilterBar from './shared/OnlineProviderFilterBar';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import { hasNeteaseSession, hasQQMusicSession } from '../utils/onlineLibraryAccess';
import { resolveSearchableLibraryProviders } from '../utils/onlineSearchRouting';
import { resolvePeerDefaultDescription, resolvePeerDefaultDisplayName, resolveProviderDefaultChannel } from '../utils/onlineDefaultPlaylists';
import { isPeerFreeProviderId } from '../utils/onlinePeerProviders';
import { SearchClearButton } from './shared/SearchClearButton';
import { resolveOnlineSearchProvider } from '../utils/onlineSearchRouting';
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
    ) {
        return playlist.musicProvider;
    }
    return 'netease';
};

export const Grid3D: React.FC<Grid3DProps> = (props) => {
    const {
        onRefreshUser,
        user,
        playlists,
        currentTrack,
        localSongs,
        onSearchCommitted,
        onOpenGridView,
        stageEnabled = false,
        stageIsActive = false,
        onOpenStagePlayer,
    } = props;

    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const searchProvider = useOnlineLibraryFilterStore(state => state.searchProvider);
    const moduleFilter = useOnlineLibraryFilterStore(state => state.moduleFilter);
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const setSearchProvider = useOnlineLibraryFilterStore(state => state.setSearchProvider);
    const {
        homeSearchQuery,
        setHomeSearchQuery,
        isSearching,
        submitSearch,
        restoreSearch,
        openPeerSearchChannel,
    } = useSearchNavigationStore(useShallow(state => ({
        homeSearchQuery: state.homeSearchQuery,
        setHomeSearchQuery: state.setHomeSearchQuery,
        isSearching: state.isSearching,
        submitSearch: state.submitSearch,
        restoreSearch: state.restoreSearch,
        openPeerSearchChannel: state.openPeerSearchChannel,
    })));
    const hasNeteaseLogin = hasNeteaseSession(user);
    const hasQQLogin = hasQQMusicSession();
    const searchableProviders = useMemo(
        () => resolveSearchableLibraryProviders(playlistProviders, {
            netease: hasNeteaseLogin,
            qq: hasQQLogin,
        }),
        [hasNeteaseLogin, hasQQLogin, playlistProviders],
    );
    const homeSearchPlaceholder = useMemo(() => {
        if (searchableProviders.length > 1) {
            return t('home.searchMultiSources');
        }
        const only = searchableProviders[0] || searchProvider;
        if (only === 'qq') return t('home.searchQQMusic');
        if (only === 'qishui') return t('home.searchQishuiMusic');
        if (only === 'coco') return t('home.searchCocoMusic');
        if (only === 'kugou') return t('home.searchKugouMusic');
        if (only === 'bilibili') return t('home.searchBilibiliMusic');
        return t('home.searchDatabase');
    }, [searchProvider, searchableProviders, t]);

    const playlistCards = useMemo(() => playlists.map(p => ({
        id: p.id,
        name: p.specialType === 'provider-default'
            ? resolvePeerDefaultDisplayName(p.musicProvider, t)
            : p.name,
        coverUrl: p.coverImgUrl || (p as any).coverUrl,
        trackCount: p.trackCount,
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
        if (isPeerFreeProviderId(provider)) {
            openPeerSearchChannel({
                sourceTab: provider,
                returnView: 'home',
            });
            return;
        }
        // Independent login-provider entry starts empty — never borrow the home bar draft.
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

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const query = homeSearchQuery.trim();
        if (!query) {
            openSearchChannel(searchProvider);
            return;
        }

        const resolvedProvider = resolveOnlineSearchProvider(
            query,
            searchableProviders[0] || searchProvider,
        );
        if (searchableProviders.length === 1) {
            setSearchProvider(searchableProviders[0]);
        }

        const didSearch = await submitSearch({
            query,
            sourceTab: resolvedProvider,
            providers: searchableProviders.length > 0
                ? [...searchableProviders]
                : [resolvedProvider],
            deps: {
                localSongs,
                t: (key, fallback) => t(key, fallback ?? ''),
            },
        });

        if (didSearch) {
            onSearchCommitted(query, resolvedProvider);
        }
    };

    const mainBg = resolveHomeSolidBackgroundClass(isDaylight);
    const inputBg = isDaylight ? 'bg-black/5 focus:bg-black/10' : 'bg-white/5 focus:bg-white/10';
    const navPillBg = isDaylight ? 'bg-black/5' : 'bg-white/10';
    const navPillInactiveText = isDaylight ? 'text-black/60 hover:text-black' : 'text-white/60 hover:text-white';

    return (
        <div className={`relative w-full h-full flex flex-col font-sans overflow-hidden ${mainBg} pointer-events-auto`} style={{ color: 'var(--text-primary)' }}>
            <div className={`w-full max-w-7xl mx-auto z-20 relative shrink-0 px-4 md:px-6 ${HOME_HEADER_TOP_PADDING_CLASS} ${HOME_HEADER_BOTTOM_PADDING_CLASS}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-y-4 md:gap-y-0">
                    {/* Brand/settings live in AppSidebar */}
                    <div className="flex items-center justify-start order-1 md:order-none min-h-10" />

                    <div className="flex justify-center order-3 md:order-none col-span-2 md:col-span-1">
                        {stageEnabled ? (
                            <button
                                onClick={() => onOpenStagePlayer?.()}
                                data-stage-active={stageIsActive ? 'true' : 'false'}
                                className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${navPillBg} ${navPillInactiveText}`}
                            >
                                <span className="relative z-10">{t('home.stage') || '舞台'}</span>
                            </button>
                        ) : null}
                    </div>

                    <div className="flex justify-end order-2 md:order-none">
                        <form onSubmit={handleSearch} className="relative w-full md:w-56 transition-all focus-within:md:w-72">
                            {isSearching ? (
                                <Loader2 className="absolute left-3 top-1/2 w-4 h-4 animate-spin opacity-40 -mt-2" />
                            ) : (
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 w-4 h-4 cursor-pointer hover:opacity-100 transition-opacity"
                                    onClick={() => handleSearch()}
                                />
                            )}
                            <input
                                type="text"
                                placeholder={homeSearchPlaceholder}
                                value={homeSearchQuery}
                                onChange={e => setHomeSearchQuery(e.target.value)}
                                className={`w-full ${inputBg} border border-white/10 rounded-full py-2 pl-10 pr-9 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-current placeholder:opacity-40`}
                                style={{ color: 'var(--text-primary)' }}
                            />
                            <SearchClearButton
                                visible={Boolean(homeSearchQuery)}
                                onClear={() => setHomeSearchQuery('')}
                                label={t('app.clearSearch')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            />
                        </form>
                    </div>
                </div>
            </div>

            <div className={`w-full pt-1 ${HOME_FILTER_BOTTOM_PADDING_CLASS} shrink-0 relative z-30`}>
                <OnlineProviderFilterBar
                    neteaseConnected={hasNeteaseLogin}
                    qqConnected={hasQQLogin}
                    onRefreshUser={onRefreshUser}
                />
            </div>

            <div className={`flex-1 min-h-0 relative ${HOME_CONTENT_TOP_PADDING_CLASS}`}>
                <OnlineHomeFlatSurface
                    items={playlistCards}
                    isDaylight={isDaylight}
                    hasFloatingPlayer={Boolean(currentTrack)}
                    moduleFilter={moduleFilter}
                    onSelectPlaylist={handleSelectCollectionCard}
                    emptyMessage={playlistCards.length === 0
                        ? t('home.noFilteredPlaylists')
                        : t('home.loadingLibrary')}
                />
            </div>
        </div>
    );
};

export default Grid3D;
