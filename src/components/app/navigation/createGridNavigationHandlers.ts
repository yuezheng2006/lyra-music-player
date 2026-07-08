interface CreateGridNavigationHandlersParams {
    homeLayoutStyle: 'carousel' | 'grid';
    setActiveGridViewCollection: (collection: any | null) => void;
    navigateDirectHome: (options?: { clearContext?: boolean }) => void;
    navigateToNeteaseAlbum: (albumId: number) => void;
    navigateToNeteaseArtist: (artistId: number) => void;
}

/** 创建首页与播放器面板共用的网格/经典导航处理器。 */
export function createGridNavigationHandlers({
    homeLayoutStyle,
    setActiveGridViewCollection,
    navigateDirectHome,
    navigateToNeteaseAlbum,
    navigateToNeteaseArtist,
}: CreateGridNavigationHandlersParams) {
    const handleUnifiedAlbumSelect = (albumId: number) => {
        if (homeLayoutStyle === 'grid') {
            setActiveGridViewCollection({
                source: 'netease',
                id: albumId,
                type: 'album',
                name: '专辑',
            });
            navigateDirectHome({ clearContext: false });
        } else {
            navigateToNeteaseAlbum(albumId);
        }
    };

    const handleUnifiedArtistSelect = (artistId: number) => {
        if (homeLayoutStyle === 'grid') {
            setActiveGridViewCollection({
                source: 'netease',
                id: artistId,
                type: 'artist',
                name: '歌手',
            });
            navigateDirectHome({ clearContext: false });
        } else {
            navigateToNeteaseArtist(artistId);
        }
    };

    const handlePlayerPanelAlbumSelect = (albumId: number) => {
        if (homeLayoutStyle === 'grid') {
            setActiveGridViewCollection({
                source: 'netease',
                id: albumId,
                type: 'album',
                name: '专辑',
                returnToPlayerOnClose: true,
            });
            navigateDirectHome({ clearContext: false });
        } else {
            navigateToNeteaseAlbum(albumId);
        }
    };

    const handlePlayerPanelArtistSelect = (artistId: number) => {
        if (homeLayoutStyle === 'grid') {
            setActiveGridViewCollection({
                source: 'netease',
                id: artistId,
                type: 'artist',
                name: '歌手',
                returnToPlayerOnClose: true,
            });
            navigateDirectHome({ clearContext: false });
        } else {
            navigateToNeteaseArtist(artistId);
        }
    };

    return {
        handleUnifiedAlbumSelect,
        handleUnifiedArtistSelect,
        handlePlayerPanelAlbumSelect,
        handlePlayerPanelArtistSelect,
    };
}
