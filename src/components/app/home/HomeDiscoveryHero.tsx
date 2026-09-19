import React from 'react';
import type { SongResult } from '../../../types';
import { useRecentListenShelf } from '../../../hooks/useRecentListenShelf';
import HomeRecentListenCard from './HomeRecentListenCard';

// src/components/app/home/HomeDiscoveryHero.tsx
// Greeting recents only. Liked songs stay in the personal-library canvas.

type HomeDiscoveryHeroProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
};

const HomeDiscoveryHero: React.FC<HomeDiscoveryHeroProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { entries, loading } = useRecentListenShelf();
    if (loading || entries.length === 0) return null;

    return (
        <section
            className="mt-3 flex min-w-0 shrink-0"
            data-app-ui-surface="home-discovery-hero"
        >
            <HomeRecentListenCard
                isDaylight={isDaylight}
                variant="hero"
                onPlaySong={onPlaySong}
            />
        </section>
    );
};

export default HomeDiscoveryHero;
