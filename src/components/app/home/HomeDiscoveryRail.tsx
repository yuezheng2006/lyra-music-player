import React from 'react';
import type { NeteasePlaylist, NeteaseUser, SongResult } from '../../../types';
import { hasNeteaseSession, hasQQMusicSession } from '../../../utils/onlineLibraryAccess';
import { resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';
import { resolveDiscoveryRailColumns } from '../../../utils/home/discoveryRailMath';
import HomeListeningDesk from './HomeListeningDesk';
import HomeDiscoveryHero from './HomeDiscoveryHero';
import HomePersonalizedPlaylistShelf from './HomePersonalizedPlaylistShelf';
import HomeChartPreviewShelf from './HomeChartPreviewShelf';
import LibraryInviteRow from './LibraryInviteRow';

// src/components/app/home/HomeDiscoveryRail.tsx
// Signed-in 歌单 is browse: greeting, recommended playlists, charts. Play-now is 私人漫游.

type HomeDiscoveryRailProps = {
    isDaylight: boolean;
    user?: NeteaseUser | null;
    playlists?: NeteasePlaylist[];
    hasFloatingPlayer?: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
    onSelectPlaylist?: (playlist: NeteasePlaylist) => void;
    onRefreshUser?: () => void;
};

const HomeDiscoveryRail: React.FC<HomeDiscoveryRailProps> = ({
    isDaylight,
    user = null,
    playlists = [],
    hasFloatingPlayer = false,
    onPlaySong,
    onSelectPlaylist,
    onRefreshUser,
}) => {
    const fillStage = !hasNeteaseSession(user) && !hasQQMusicSession();
    const showInvite = Boolean(onRefreshUser) && fillStage;
    const columns = resolveDiscoveryRailColumns({
        signedIn: !fillStage,
        hasInvite: showInvite,
    });

    return (
        <div
            className={`relative z-20 mx-auto flex w-full max-w-7xl flex-col px-4 md:px-8 ${
                fillStage
                    ? `min-h-0 flex-1 ${resolveHomeContentBottomPaddingClass(hasFloatingPlayer)}`
                    : 'shrink-0'
            }`}
        >
            {columns.map((column) => {
                if (column === 'desk-stage') {
                    return (
                        <HomeListeningDesk
                            key={column}
                            isDaylight={isDaylight}
                            mode="stage"
                            onPlaySong={onPlaySong}
                        />
                    );
                }
                if (column === 'invite' && onRefreshUser) {
                    return (
                        <div key={column} className="mt-3 shrink-0">
                            <LibraryInviteRow onRefreshUser={onRefreshUser} />
                        </div>
                    );
                }
                if (column === 'hero') {
                    return (
                        <HomeDiscoveryHero
                            key={column}
                            isDaylight={isDaylight}
                            onPlaySong={onPlaySong}
                        />
                    );
                }
                if (column === 'personalized') {
                    return (
                        <HomePersonalizedPlaylistShelf
                            key={column}
                            isDaylight={isDaylight}
                            user={user}
                            onSelectPlaylist={onSelectPlaylist}
                        />
                    );
                }
                if (column === 'charts') {
                    return (
                        <HomeChartPreviewShelf
                            key={column}
                            isDaylight={isDaylight}
                            onPlaySong={onPlaySong}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

export default HomeDiscoveryRail;
