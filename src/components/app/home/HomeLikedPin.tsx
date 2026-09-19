import React from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NeteasePlaylist, NeteaseUser } from '../../../types';
import { hasNeteaseSession } from '../../../utils/onlineLibraryAccess';
import { findLikedNamedItem } from '../../../utils/home/onlineHomeLibraryMath';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import HomeFeatureCard from './HomeFeatureCard';

// src/components/app/home/HomeLikedPin.tsx
// Compact rail entry that opens the signed-in liked-songs playlist.

type HomeLikedPinProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    playlists: NeteasePlaylist[];
    onSelectPlaylist?: (playlist: NeteasePlaylist) => void;
};

const HomeLikedPin: React.FC<HomeLikedPinProps> = ({
    isDaylight,
    user,
    playlists,
    onSelectPlaylist,
}) => {
    const { t } = useTranslation();
    const neteaseEnabled = useOnlineLibraryFilterStore(state => state.playlistProviders.netease !== false);
    const likedPlaylist = findLikedNamedItem(playlists);

    if (!hasNeteaseSession(user) || !neteaseEnabled || !likedPlaylist || !onSelectPlaylist) {
        return null;
    }

    return (
        <HomeFeatureCard
            isDaylight={isDaylight}
            title={t('home.likedPinTitle')}
            subtitle={t('home.likedPinSubtitle', { count: likedPlaylist.trackCount })}
            icon={Heart}
            coverUrl={likedPlaylist.coverImgUrl}
            onClick={() => onSelectPlaylist(likedPlaylist)}
        />
    );
};

export default HomeLikedPin;
