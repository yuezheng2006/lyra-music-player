import React from 'react';
import type { SongResult } from '../../../types';
import HomeDailyMixEntry from './HomeDailyMixEntry';
import HomePlatformPicksEntry from './HomePlatformPicksEntry';

// src/components/app/home/HomeDiscoveryRail.tsx
// Playlist-home discovery strip: Daily Mix + Platform Picks.

type HomeDiscoveryRailProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
    onOpenAccount?: () => void;
};

const HomeDiscoveryRail: React.FC<HomeDiscoveryRailProps> = ({
    isDaylight,
    onPlaySong,
    onOpenAccount,
}) => (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 shrink-0 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <HomeDailyMixEntry isDaylight={isDaylight} onPlaySong={onPlaySong} />
            <HomePlatformPicksEntry isDaylight={isDaylight} onOpenAccount={onOpenAccount} />
        </div>
    </div>
);

export default HomeDiscoveryRail;
