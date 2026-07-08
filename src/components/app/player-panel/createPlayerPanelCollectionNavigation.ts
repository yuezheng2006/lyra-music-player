import type { SongResult } from '@/types';
import { isLocalPlaybackSong } from '@/utils/appPlaybackGuards';

interface CreatePlayerPanelCollectionNavigationParams {
    homeLayoutStyle: 'carousel' | 'grid';
    currentSong: SongResult | null;
    localSongs: Array<{
        id: string;
        album?: string;
        matchedAlbumName?: string;
        artist?: string;
        matchedArtists?: string;
    }>;
    setActiveGridViewCollection: (collection: any | null) => void;
    navigateDirectHome: (options?: { clearContext?: boolean }) => void;
    openCurrentLocalAlbum: () => void;
    openCurrentLocalArtist: () => void;
    openCurrentNavidromeAlbum: () => void;
    openCurrentNavidromeArtist: () => void;
}

/** 创建播放器面板中打开当前专辑/歌手集合的导航动作（支持网格与经典布局）。 */
export function createPlayerPanelCollectionNavigation({
    homeLayoutStyle,
    currentSong,
    localSongs,
    setActiveGridViewCollection,
    navigateDirectHome,
    openCurrentLocalAlbum,
    openCurrentLocalArtist,
    openCurrentNavidromeAlbum,
    openCurrentNavidromeArtist,
}: CreatePlayerPanelCollectionNavigationParams) {
    const openCurrentLocalAlbumAction = () => {
        if (homeLayoutStyle === 'grid') {
            if (currentSong && isLocalPlaybackSong(currentSong) && currentSong.localData) {
                const localSong = currentSong.localData;
                const albumName = currentSong.al?.name || currentSong.album?.name || localSong.matchedAlbumName || localSong.album;
                if (albumName) {
                    const songs = localSongs.filter(song => {
                        const candidateAlbum = song.matchedAlbumName || song.album || '';
                        return candidateAlbum === albumName;
                    });
                    if (songs.length > 0) {
                        setActiveGridViewCollection({
                            source: 'local',
                            id: `album-current-${albumName}`,
                            name: albumName,
                            type: 'album',
                            coverUrl: currentSong.al?.picUrl || currentSong.album?.picUrl || undefined,
                            description: currentSong.ar?.map(artist => artist.name).join(', '),
                            trackCount: songs.length,
                            songIds: songs.map(song => song.id),
                            returnToPlayerOnClose: true,
                        });
                        navigateDirectHome({ clearContext: false });
                    }
                }
            }
        } else {
            openCurrentLocalAlbum();
        }
    };

    const openCurrentLocalArtistAction = () => {
        if (homeLayoutStyle === 'grid') {
            if (currentSong && isLocalPlaybackSong(currentSong) && currentSong.localData) {
                const artistName = currentSong.ar?.[0]?.name || currentSong.artists?.[0]?.name || currentSong.localData.matchedArtists || currentSong.localData.artist;
                if (artistName) {
                    const songs = localSongs.filter(song => {
                        const candidateArtist = song.matchedArtists || song.artist || '';
                        return candidateArtist === artistName;
                    });
                    if (songs.length > 0) {
                        setActiveGridViewCollection({
                            source: 'local',
                            id: `artist-current-${artistName}`,
                            name: artistName,
                            type: 'artist',
                            coverUrl: currentSong.al?.picUrl || currentSong.album?.picUrl || undefined,
                            description: `${songs.length} 首歌曲`,
                            trackCount: songs.length,
                            songIds: songs.map(song => song.id),
                            returnToPlayerOnClose: true,
                        });
                        navigateDirectHome({ clearContext: false });
                    }
                }
            }
        } else {
            openCurrentLocalArtist();
        }
    };

    const openCurrentNavidromeAlbumAction = () => {
        if (homeLayoutStyle === 'grid') {
            const currentNavidromeSong = (currentSong as any)?.navidromeData;
            const playbackCarrier = currentNavidromeSong?.navidromeData;
            const albumId = currentNavidromeSong?.albumId || playbackCarrier?.albumId;
            if (albumId) {
                const albumName = currentSong?.al?.name || currentSong?.album?.name || '专辑';
                setActiveGridViewCollection({
                    source: 'navidrome',
                    id: albumId,
                    name: albumName,
                    type: 'album',
                    coverUrl: currentSong?.al?.picUrl || currentSong?.album?.picUrl || undefined,
                    returnToPlayerOnClose: true,
                });
                navigateDirectHome({ clearContext: false });
            }
        } else {
            openCurrentNavidromeAlbum();
        }
    };

    const openCurrentNavidromeArtistAction = () => {
        if (homeLayoutStyle === 'grid') {
            const currentNavidromeSong = (currentSong as any)?.navidromeData;
            const playbackCarrier = currentNavidromeSong?.navidromeData;
            const artistId = currentNavidromeSong?.artistId || playbackCarrier?.artistId;
            if (artistId) {
                const artistName = currentSong?.ar?.[0]?.name || currentSong?.artists?.[0]?.name || '歌手';
                setActiveGridViewCollection({
                    source: 'navidrome',
                    id: artistId,
                    name: artistName,
                    type: 'artist',
                    coverUrl: currentSong?.al?.picUrl || currentSong?.album?.picUrl || undefined,
                    returnToPlayerOnClose: true,
                });
                navigateDirectHome({ clearContext: false });
            }
        } else {
            openCurrentNavidromeArtist();
        }
    };

    return {
        openCurrentLocalAlbum: openCurrentLocalAlbumAction,
        openCurrentLocalArtist: openCurrentLocalArtistAction,
        openCurrentNavidromeAlbum: openCurrentNavidromeAlbumAction,
        openCurrentNavidromeArtist: openCurrentNavidromeArtistAction,
    };
}
