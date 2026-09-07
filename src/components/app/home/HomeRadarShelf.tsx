import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { NeteasePlaylist, NeteaseUser, SongResult } from '../../../types';
import { useNeteaseDiscoveryStore } from '../../../stores/useNeteaseDiscoveryStore';
import { hasNeteaseSession } from '../../../utils/onlineLibraryAccess';
import { playDiscoverySongs } from '../../../utils/home/startNeteaseDiscoveryPlayback';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { HOME_PLAYLIST_SHELF_GRID_CLASS } from '../../../utils/home/discoveryRailMath';
import { HomeShelfCard } from '../../shared/HomeShelfCard';
import HomeShelfHeader from './HomeShelfHeader';

// src/components/app/home/HomeRadarShelf.tsx
// Official NetEase radar playlists as a home discovery shelf.

type HomeRadarShelfProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
    onSelectPlaylist?: (playlist: NeteasePlaylist) => void;
};

const HomeRadarShelf: React.FC<HomeRadarShelfProps> = ({
    isDaylight,
    user,
    onPlaySong,
    onSelectPlaylist,
}) => {
    const { t } = useTranslation();
    const neteaseEnabled = useOnlineLibraryFilterStore(state => state.playlistProviders.netease !== false);
    const {
        radarItems,
        radarLoading,
        actionBusy,
        ensureRadarLoaded,
        loadRadarSongs,
    } = useNeteaseDiscoveryStore(useShallow(state => ({
        radarItems: state.radarItems,
        radarLoading: state.radarLoading,
        actionBusy: state.actionBusy,
        ensureRadarLoaded: state.ensureRadarLoaded,
        loadRadarSongs: state.loadRadarSongs,
    })));

    useEffect(() => {
        if (!hasNeteaseSession(user) || !neteaseEnabled) return;
        void ensureRadarLoaded();
    }, [ensureRadarLoaded, neteaseEnabled, user]);

    if (!hasNeteaseSession(user) || !neteaseEnabled) return null;

    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';

    const playRadar = async (playlistId: number, name: string, coverUrl: string) => {
        const songs = await loadRadarSongs(playlistId);
        if (playDiscoverySongs(songs, onPlaySong, false)) return;
        if (!onSelectPlaylist) return;
        onSelectPlaylist({
            id: playlistId,
            name,
            coverImgUrl: coverUrl,
            trackCount: 0,
            playCount: 0,
            updateTime: 0,
            trackUpdateTime: 0,
            creator: user ?? { userId: 0, nickname: '', avatarUrl: '' },
        });
    };

    return (
        <section className="mt-3 mb-3">
            <HomeShelfHeader
                title={t('home.radarTitle')}
                subtitle={t('home.radarSubtitle')}
                isDaylight={isDaylight}
            />
            <div className={HOME_PLAYLIST_SHELF_GRID_CLASS}>
                {radarItems.length === 0 && radarLoading ? (
                    <div className={`text-[11px] ${muted}`}>{t('home.radarLoading')}</div>
                ) : null}
                {radarItems.map(item => (
                    <HomeShelfCard
                        key={item.id}
                        title={item.title || t(item.fallbackTitleKey)}
                        subtitle={item.subtitle || t('home.radarPlay')}
                        coverUrl={item.coverUrl}
                        placeholderVariant="playlist"
                        provider="netease"
                        isDaylight={isDaylight}
                        disabled={actionBusy === item.id}
                        onSelect={() => { void playRadar(item.id, item.title, item.coverUrl); }}
                    />
                ))}
            </div>
        </section>
    );
};

export default HomeRadarShelf;
