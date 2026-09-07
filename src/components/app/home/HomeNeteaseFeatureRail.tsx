import React, { useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { NeteasePlaylist, NeteaseUser, SongResult } from '../../../types';
import { useNeteaseDiscoveryStore } from '../../../stores/useNeteaseDiscoveryStore';
import { hasNeteaseSession } from '../../../utils/onlineLibraryAccess';
import { resolveNeteaseLikedPlaylist } from '../../../utils/home/neteaseDiscoveryMath';
import { playDiscoverySongs } from '../../../utils/home/startNeteaseDiscoveryPlayback';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import HomeFeatureCard from './HomeFeatureCard';

// src/components/app/home/HomeNeteaseFeatureRail.tsx
// Heartbeat starts from Personal FM. Playlist home only pins liked songs.

type HomeNeteaseFeatureRailProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    playlists: NeteasePlaylist[];
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
};

const HomeNeteaseFeatureRail: React.FC<HomeNeteaseFeatureRailProps> = ({
    isDaylight,
    user,
    playlists,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const neteaseEnabled = useOnlineLibraryFilterStore(state => state.playlistProviders.netease !== false);
    const { actionBusy, startHeartbeat } = useNeteaseDiscoveryStore(useShallow(state => ({
        actionBusy: state.actionBusy,
        startHeartbeat: state.startHeartbeat,
    })));
    const likedPlaylist = resolveNeteaseLikedPlaylist(playlists, user);
    const signedIn = hasNeteaseSession(user);

    const handleHeartbeat = useCallback(async () => {
        if (!user?.userId || !likedPlaylist) return;
        const songs = await startHeartbeat({
            user,
            likedPlaylistId: likedPlaylist.id,
        });
        playDiscoverySongs(songs, onPlaySong, false);
    }, [likedPlaylist, onPlaySong, startHeartbeat, user]);

    if (!signedIn || !neteaseEnabled) return null;

    return (
        <HomeFeatureCard
            isDaylight={isDaylight}
            title={t('home.featureHeartbeatTitle')}
            subtitle={likedPlaylist
                ? t('home.featureHeartbeatSubtitle')
                : t('home.featureHeartbeatNeedLiked')}
            icon={Heart}
            busy={actionBusy === 'heartbeat'}
            disabled={!likedPlaylist}
            onClick={() => { void handleHeartbeat(); }}
        />
    );
};

export default HomeNeteaseFeatureRail;
