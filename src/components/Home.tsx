import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { neteaseApi } from '../services/netease';
import { NeteaseUser, NeteasePlaylist, SongResult, LocalSong, LocalLibraryGroup, LocalPlaylist, type SearchSourceId, type StageStatus, type StageSource, type Theme } from '../types';
import { NavidromeSong, NavidromeViewSelection } from '../types/navidrome';
import { LOCAL_MUSIC_SCAN_PROGRESS_EVENT } from '../services/localMusicService';
import LocalMusicView from './LocalMusicView';
import NavidromeMusicView from './navidrome/NavidromeMusicView';
import { motion, AnimatePresence } from 'framer-motion';
import Carousel3D from './Carousel3D';
import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import OnlineMusicGuestConnect from './shared/OnlineMusicGuestConnect';
import OnlineProviderFilterBar from './shared/OnlineProviderFilterBar';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import { hasAnyOnlineMusicSession, hasNeteaseSession, hasQQMusicSession } from '../utils/onlineLibraryAccess';
import { resolveSearchableLibraryProviders } from '../utils/onlineSearchRouting';
import { useOnlineGuestStore } from '../stores/useOnlineGuestStore';
import { useShallow } from 'zustand/react/shallow';
import {
    HOME_FILTER_BOTTOM_PADDING_CLASS,
    HOME_HEADER_BOTTOM_PADDING_CLASS,
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeContentBottomPaddingClass,
    resolveHomeSolidBackgroundClass,
} from './app/home/homeSurfaceStyles';

interface HomeProps {
    onPlaySong: (
        song: SongResult,
        playlistCtx?: SongResult[],
        isFmCall?: boolean,
        options?: { shouldNavigateToPlayer?: boolean },
    ) => void;
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
    onPlayLocalSong: (
        song: LocalSong,
        queue?: LocalSong[],
        options?: { shouldNavigateToPlayer?: boolean },
    ) => void;
    onAddLocalSongToQueue?: (song: LocalSong) => void;
    focusedPlaylistIndex?: number;
    setFocusedPlaylistIndex?: (index: number) => void;
    focusedFavoriteAlbumIndex?: number;
    setFocusedFavoriteAlbumIndex?: (index: number) => void;
    focusedRadioIndex?: number;
    setFocusedRadioIndex?: (index: number) => void;
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
    onPlayNavidromeSong?: (
        song: NavidromeSong,
        queue?: NavidromeSong[],
        options?: { shouldNavigateToPlayer?: boolean },
    ) => void;
    onAddNavidromeSongsToQueue?: (songs: NavidromeSong[]) => void;
    onMatchNavidromeSong?: (song: NavidromeSong) => void;
    navidromeFocusedAlbumIndex?: number;
    setNavidromeFocusedAlbumIndex?: (index: number) => void;
    pendingNavidromeSelection?: NavidromeViewSelection | null;
    onPendingNavidromeSelectionHandled?: () => void;
    onSearchCommitted: (query: string, sourceTab: SearchSourceId, replace?: boolean) => void;
    stageEnabled?: boolean;
    stageSource?: StageSource | null;
    stageIsActive?: boolean;
    onOpenStagePlayer?: () => void;
    stageStatus?: StageStatus | null;
    onToggleStageMode?: (enabled: boolean) => Promise<void> | void;
    onStageSourceChange?: (source: StageSource) => Promise<void> | void;
    onRegenerateStageToken?: () => Promise<void> | void;
    onClearStageState?: () => Promise<void> | void;
    theme: Theme;
    onOpenSettings?: (initialTab?: 'help' | 'options', initialSubview?: 'integration' | null) => void;
    navidromeEnabled?: boolean;
    onPlayAll?: (
        songs: SongResult[],
        options?: { shouldNavigateToPlayer?: boolean },
    ) => void;
    onAddAllToQueue?: (songs: SongResult[]) => void;
    onAddSongToQueue?: (song: SongResult) => void;
}

const Home: React.FC<HomeProps> = ({
    onPlaySong,
    onBackToPlayer: _onBackToPlayer,
    onRefreshUser,
    user,
    playlists,
    cloudPlaylist = null,
    favoriteAlbums = [],
    isFavoriteAlbumsLoading = false,
    favoriteAlbumsLoadFailed = false,
    currentTrack,
    isPlaying,
    onSelectPlaylist,
    onSelectAlbum,
    onSelectArtist,
    onSelectLocalAlbum,
    onSelectLocalArtist,
    localSongs,
    localPlaylists,
    onRefreshLocalSongs,
    onPlayLocalSong,
    onAddLocalSongToQueue,
    focusedPlaylistIndex = 0,
    setFocusedPlaylistIndex,
    focusedFavoriteAlbumIndex = 0,
    setFocusedFavoriteAlbumIndex,
    focusedRadioIndex = 0,
    setFocusedRadioIndex,
    localMusicState,
    setLocalMusicState,
    onMatchSong,
    onPlayNavidromeSong,
    onAddNavidromeSongsToQueue,
    onMatchNavidromeSong,
    navidromeFocusedAlbumIndex = 0,
    setNavidromeFocusedAlbumIndex,
    pendingNavidromeSelection = null,
    onPendingNavidromeSelectionHandled,
    onSearchCommitted,
    stageEnabled = false,
    stageSource = null,
    stageIsActive = false,
    onOpenStagePlayer,
    stageStatus = null,
    onToggleStageMode,
    onStageSourceChange,
    onRegenerateStageToken,
    onClearStageState,
    theme,
    onOpenSettings,
    navidromeEnabled = false,
}) => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const {
        homeViewTab,
        searchQuery,
        setSearchQuery,
        isSearching,
        submitSearch,
    } = useSearchNavigationStore(useShallow(state => ({
        homeViewTab: state.homeViewTab,
        searchQuery: state.searchQuery,
        setSearchQuery: state.setSearchQuery,
        isSearching: state.isSearching,
        submitSearch: state.submitSearch,
    })));
    const viewTab = homeViewTab;
    const searchProvider = useOnlineLibraryFilterStore(state => state.searchProvider);
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const hasNeteaseLogin = hasNeteaseSession(user);
    const hasQQLogin = hasQQMusicSession();
    const searchableProviders = resolveSearchableLibraryProviders(playlistProviders, {
        netease: hasNeteaseLogin,
        qq: hasQQLogin,
    });
    const onlineGuestEntered = useOnlineGuestStore(state => state.entered);
    const hasAnyOnlineLogin = hasAnyOnlineMusicSession(user);
    const showGuestConnect = viewTab === 'playlist' && !hasAnyOnlineLogin && !onlineGuestEntered;
    const showOnlineLibrary = viewTab === 'playlist' && (hasAnyOnlineLogin || onlineGuestEntered);
    const homeContentBottomPadding = currentTrack
        ? resolveHomeContentBottomPaddingClass(true)
        : '';
    const playlistCards = playlists;
    const homeSearchPlaceholder = searchableProviders.length > 1
        ? t('home.searchMultiSources')
        : (searchableProviders[0] || searchProvider) === 'qq'
            ? t('home.searchQQMusic')
            : (searchableProviders[0] || searchProvider) === 'coco'
                ? t('home.searchCocoMusic')
                : t('home.searchDatabase');
    // const isDaylight = theme.name === 'Daylight Default'; // Deprecated, passed as prop

    useEffect(() => {
        // Free peer provider (coco) keeps the online home available without login.
        useOnlineGuestStore.getState().enter();
    }, []);

    // Opaque home surface — do not let interactive3d / particle stage show through.
    const mainBg = resolveHomeSolidBackgroundClass(isDaylight);
    const inputBg = isDaylight ? 'bg-black/5 focus:bg-black/10' : 'bg-white/5 focus:bg-white/10';
    // For pill nav container
    const navPillBg = isDaylight ? 'bg-black/5' : 'bg-white/10';
    const navPillInactiveText = isDaylight ? 'text-black/60 hover:text-black' : 'text-white/78 hover:text-white';
    // UI State
    const [scanProgress, setScanProgress] = useState<{
        active: boolean;
        folderName: string;
        totalSongs: number;
        completedSongs: number;
    } | null>(null);
    const [scanDetailsExpanded, setScanDetailsExpanded] = useState(false);
    const scanProgressPercent = scanProgress?.totalSongs
        ? Math.min(100, Math.round((scanProgress.completedSongs / scanProgress.totalSongs) * 100))
        : 0;

    const [searchNavidromeSelection, setSearchNavidromeSelection] = useState<NavidromeViewSelection | null>(null);
    const [isLocalPlaylistOpen, setIsLocalPlaylistOpen] = useState(false);

    // Swipe handling
    // const touchStartY = useRef(0);
    // const touchEndY = useRef(0);

    // const onTouchStart = (e: React.TouchEvent) => {
    //     touchStartY.current = e.targetTouches[0].clientY;
    // };

    // const onTouchEnd = (e: React.TouchEvent) => {
    //     touchEndY.current = e.changedTouches[0].clientY;
    //     const diff = touchStartY.current - touchEndY.current;

    //     // Threshold of 50px
    //     if (Math.abs(diff) > 50) {
    //         // Swipe Up (diff > 0) -> Go to Albums (if in Playlist)
    //         if (diff > 0 && viewTab === 'playlist') {
    //             setViewTab('albums');
    //         }
    //         // Swipe Down (diff < 0) -> Go to Playlist (if in Albums)
    //         else if (diff < 0 && viewTab === 'albums') {
    //             setViewTab('playlist');
    //         }
    //     }
    // };

    // Swipe handling
    const [radioItems, setRadioItems] = useState<any[]>([]);
    const [loadingRadio, setLoadingRadio] = useState(false);
    const [radioLoaded, setRadioLoaded] = useState(false);

    useEffect(() => {
        if (viewTab === 'radio' && !radioLoaded && user) {
            fetchRadioData();
        }
    }, [viewTab, user, radioLoaded]);

    const fetchRadioData = async () => {
        setLoadingRadio(true);
        try {
            const fmRes = await neteaseApi.getPersonalFm();
            let fmCoverUrl = '';
            if (fmRes.data && fmRes.data.length > 0) {
                fmCoverUrl = fmRes.data[0].album?.picUrl || fmRes.data[0].al?.picUrl || '';
            }

            const fmItem = {
                id: 'personal_fm',
                name: '私人FM',
                coverUrl: fmCoverUrl,
                description: 'Personal FM',
                isFm: true,
            };

            const personalizedRes = await neteaseApi.getPersonalizedPlaylists(35);
            let personalizedItems: any[] = [];
            if (personalizedRes.result) {
                personalizedItems = personalizedRes.result.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    coverUrl: r.picUrl,
                    trackCount: r.trackCount,
                    description: r.copywriter || '推荐歌单'
                }));
            }
            
            setRadioItems([fmItem, ...personalizedItems]);
            setRadioLoaded(true);
        } catch (e) {
            console.error("Failed to fetch radio data", e);
        } finally {
            setLoadingRadio(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        const sourceTab = viewTab === 'playlist'
            ? (searchableProviders[0] || searchProvider)
            : viewTab;

        const didSearch = await submitSearch({
            query,
            sourceTab,
            providers: viewTab === 'playlist' && searchableProviders.length > 0
                ? [...searchableProviders]
                : undefined,
            deps: {
                localSongs,
                t: (key, fallback) => t(key, fallback ?? ''),
            },
        });

        if (didSearch) {
            onSearchCommitted(query, sourceTab);
        }
    };

    useEffect(() => {
        const handleScanProgress = (event: Event) => {
            const customEvent = event as CustomEvent<{
                active: boolean;
                folderName: string;
                totalSongs: number;
                completedSongs: number;
            }>;
            setScanProgress(customEvent.detail);
            if (!customEvent.detail.active) {
                setScanDetailsExpanded(false);
            }
        };

        window.addEventListener(LOCAL_MUSIC_SCAN_PROGRESS_EVENT, handleScanProgress as EventListener);
        return () => window.removeEventListener(LOCAL_MUSIC_SCAN_PROGRESS_EVENT, handleScanProgress as EventListener);
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                key="home-main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative w-full h-full flex flex-col font-sans overflow-hidden ${mainBg} pointer-events-auto overflow-y-auto custom-scrollbar`}
                style={{ color: 'var(--text-primary)' }}
            >
                {/* Header Section */}
                {!isLocalPlaylistOpen && (
                    <div className={`grid grid-cols-2 md:grid-cols-3 items-center w-full max-w-7xl mx-auto z-20 relative shrink-0 px-4 md:px-8 ${HOME_HEADER_TOP_PADDING_CLASS} ${HOME_HEADER_BOTTOM_PADDING_CLASS} gap-y-4 md:gap-y-0`}>
                            {/* Left: scan progress only — brand/settings live in AppSidebar */}
                            <div className="flex items-center justify-start order-1 md:order-none min-h-10">
                                {scanProgress?.active && (
                                    <div
                                        className="relative ml-3"
                                        onMouseEnter={() => setScanDetailsExpanded(true)}
                                        onMouseLeave={() => setScanDetailsExpanded(false)}
                                    >
                                        <button
                                            onClick={() => setScanDetailsExpanded(prev => !prev)}
                                            className="relative rounded-full p-px transition-all"
                                            style={{
                                                background: `conic-gradient(from -90deg, ${isDaylight ? (theme?.accentColor || 'rgba(17,24,39,0.92)') : 'rgba(255,255,255,0.98)'} 0deg ${scanProgressPercent * 3.6}deg, ${isDaylight ? 'rgba(24,24,27,0.16)' : 'rgba(255,255,255,0.14)'} ${scanProgressPercent * 3.6}deg 360deg)`,
                                                borderRadius: '999px'
                                            }}
                                            title="查看扫描进度"
                                        >
                                            <div
                                                className={`relative flex items-center justify-center min-w-[56px] h-7 px-2.5 rounded-full backdrop-blur-md ${
                                                    isDaylight ? 'bg-white/95 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]' : 'bg-zinc-950/92 text-zinc-100'
                                                }`}
                                            >
                                                <span className="relative z-10 text-[10px] font-semibold tabular-nums leading-none">
                                                    {scanProgressPercent}%
                                                </span>
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {scanDetailsExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    className={`absolute left-0 top-full mt-2 w-72 p-4 rounded-2xl border backdrop-blur-xl shadow-xl ${
                                                        isDaylight ? 'bg-white/85 border-black/10 text-zinc-800' : 'bg-black/60 border-white/10 text-zinc-100'
                                                    }`}
                                                >
                                                    <div className="text-sm font-semibold truncate">
                                                        正在扫描 {scanProgress.folderName}
                                                    </div>
                                                    <div className={`text-xs mt-1 ${isDaylight ? 'text-zinc-600' : 'text-zinc-300/70'}`}>
                                                        正在后台提取元数据与封面，媒体库较大时会持续一段时间。
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between text-xs font-mono">
                                                        <span>进度</span>
                                                        <span>{Math.min(scanProgress.completedSongs, scanProgress.totalSongs)} / {scanProgress.totalSongs}</span>
                                                    </div>
                                                    <div className={`mt-2 w-full h-2 rounded-full overflow-hidden ${isDaylight ? 'bg-black/10' : 'bg-white/10'}`}>
                                                        <div
                                                            className="h-full rounded-full transition-[width] duration-300 ease-out"
                                                            style={{
                                                                width: `${scanProgress.totalSongs > 0 ? (scanProgress.completedSongs / scanProgress.totalSongs) * 100 : 0}%`,
                                                                backgroundColor: theme?.accentColor || 'var(--text-primary)'
                                                            }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Center: Stage entry only when enabled */}
                            <div className="flex justify-center order-3 md:order-none col-span-2 md:col-span-1 select-none">
                                {stageEnabled ? (
                                    <button
                                        onClick={() => onOpenStagePlayer?.()}
                                        data-stage-active={stageIsActive ? 'true' : 'false'}
                                        className={`relative inline-flex items-center justify-center px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${navPillBg} ${navPillInactiveText}`}
                                    >
                                        <span className="relative z-10">{t('home.stage') || '舞台'}</span>
                                    </button>
                                ) : null}
                            </div>

                            {/* Right: Search Bar */}
                            <div className="flex justify-end order-2 md:order-none">
                                <form onSubmit={handleSearch} className="relative group w-full md:w-56 lg:w-60 transition-all focus-within:w-full md:focus-within:w-72 lg:focus-within:w-80">
                                    {isSearching ? (
                                        <Loader2
                                            className="absolute left-3 top-1/2 w-4 h-4 animate-spin opacity-40"
                                            style={{ marginTop: '-8px' }}
                                        />
                                    ) : (
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 w-4 h-4 cursor-pointer hover:opacity-100 transition-opacity"
                                            onClick={() => handleSearch()}
                                        />
                                    )}
                                    <input
                                        type="text"
                                        placeholder={homeSearchPlaceholder}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}

                                        className={`w-full ${inputBg} border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-current placeholder:opacity-40`}
                                        style={{ color: 'var(--text-primary)' }}
                                    />
                                </form>
                            </div>
                        </div>
                )}

                {/* Main Content Area */}
                <div className={`flex-1 min-h-0 flex flex-col items-center relative ${homeContentBottomPadding}`}>
                    {showGuestConnect ? (
                        <OnlineMusicGuestConnect onRefreshUser={onRefreshUser} user={user} />
                    ) : showOnlineLibrary && viewTab === 'playlist' ? (
                        <>
                            <div className={`w-full pt-2 ${HOME_FILTER_BOTTOM_PADDING_CLASS} relative z-30 shrink-0`}>
                                <OnlineProviderFilterBar
                                    neteaseConnected={hasNeteaseLogin}
                                    qqConnected={hasQQLogin}
                                    onRefreshUser={onRefreshUser}
                                />
                            </div>
                            <motion.div
                                key="playlist"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full flex-1 min-h-0 flex flex-col justify-center"
                            >
                                <div className="w-full flex-[0_1_clamp(420px,42vh,620px)] min-h-0 max-h-[clamp(420px,42vh,620px)]">
                                    <Carousel3D
                                        items={playlistCards.map(p => ({
                                            ...p,
                                            coverUrl: p.coverImgUrl,
                                            musicProvider: p.musicProvider === 'qq' || p.musicProvider === 'qishui' || p.musicProvider === 'coco'
                                                ? p.musicProvider
                                                : 'netease' as const,
                                            description: p.specialType === 'cloud'
                                                ? t('home.cloud')
                                                : p.specialType === 'provider-default'
                                                    ? t('home.cocoDefaultDescription')
                                                    : p.creator?.nickname,
                                        }))}
                                        onSelect={(pl) => onSelectPlaylist(pl as any)}
                                        isLoading={false}
                                        emptyMessage={playlistCards.length === 0
                                            ? t('home.noFilteredPlaylists')
                                            : t('home.loadingLibrary')}
                                        initialFocusedIndex={focusedPlaylistIndex}
                                        onFocusedIndexChange={setFocusedPlaylistIndex}
                                        isDaylight={isDaylight}
                                        hasFloatingPlayer={Boolean(currentTrack)}
                                    />
                                </div>
                            </motion.div>
                        </>
                    ) : null}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Home;
