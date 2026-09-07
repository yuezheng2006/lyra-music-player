import React, { useCallback } from 'react';
import { Heart, Loader2, Pause, Play, SkipBack, SkipForward, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { NeteasePlaylist, NeteaseUser, SongResult } from '../../../types';
import { PlayerState } from '../../../types';
import { useNeteaseDiscoveryStore } from '../../../stores/useNeteaseDiscoveryStore';
import { hasNeteaseSession } from '../../../utils/onlineLibraryAccess';
import { playDiscoverySongs } from '../../../utils/home/startNeteaseDiscoveryPlayback';
import LazyCoverImage from '../../shared/LazyCoverImage';
import OnlineMusicGuestConnect from '../../shared/OnlineMusicGuestConnect';
import { listUpcomingQueueSongs } from '../../../utils/queue/queueSectionMath';
import { resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';
import HomeListeningDesk from './HomeListeningDesk';
import HomeRadarShelf from './HomeRadarShelf';
import HomeNeteaseFeatureRail from './HomeNeteaseFeatureRail';

// src/components/app/home/FmSurface.tsx
// Play-now page: mixed desk, radar, heartbeat, then the independent FM session.

export type FmSurfaceProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    playlists?: NeteasePlaylist[];
    isFmMode: boolean;
    currentSong: SongResult | null;
    playQueue: SongResult[];
    playerState: PlayerState;
    isLiked: boolean;
    onPlaySong: (song: SongResult, queue?: SongResult[], isFmCall?: boolean) => void;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onTrash: () => void;
    onLike: () => void;
    onRefreshUser: () => void;
    onSelectPlaylist?: (playlist: NeteasePlaylist) => void;
};

const FmSurface: React.FC<FmSurfaceProps> = ({
    isDaylight,
    user,
    playlists = [],
    isFmMode,
    currentSong,
    playQueue,
    playerState,
    isLiked,
    onPlaySong,
    onTogglePlay,
    onNext,
    onPrev,
    onTrash,
    onLike,
    onRefreshUser,
    onSelectPlaylist,
}) => {
    const { t } = useTranslation();
    const { actionBusy, startPersonalFm } = useNeteaseDiscoveryStore(useShallow(state => ({
        actionBusy: state.actionBusy,
        startPersonalFm: state.startPersonalFm,
    })));
    const signedIn = hasNeteaseSession(user);
    const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl || '';
    const artist = (currentSong?.ar?.length ? currentSong.ar : currentSong?.artists)
        ?.map(item => item.name)
        .filter(Boolean)
        .join(', ') || '';
    const upcoming = isFmMode && currentSong
        ? listUpcomingQueueSongs(playQueue, currentSong.id)
        : [];
    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900'
        : 'bg-white/10 border-white/15 text-white';
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';

    const startFm = useCallback(async () => {
        const songs = await startPersonalFm();
        playDiscoverySongs(songs, onPlaySong, true);
    }, [onPlaySong, startPersonalFm]);

    return (
        <div className={`flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 md:px-8 ${resolveHomeContentBottomPaddingClass(true)}`}>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 py-4">
                <div>
                    <div className={`text-[10px] font-bold tracking-[0.14em] uppercase ${muted}`}>
                        FM
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold">{t('home.fmPageTitle')}</h1>
                    <p className={`mt-1 text-sm ${muted}`}>{t('home.fmPageSubtitle')}</p>
                </div>

                <HomeListeningDesk
                    isDaylight={isDaylight}
                    mode="strip"
                    onPlaySong={onPlaySong}
                />
                <HomeRadarShelf
                    isDaylight={isDaylight}
                    user={user}
                    onPlaySong={onPlaySong}
                    onSelectPlaylist={onSelectPlaylist}
                />
                <HomeNeteaseFeatureRail
                    isDaylight={isDaylight}
                    user={user}
                    playlists={playlists}
                    onPlaySong={onPlaySong}
                />

                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <div className={`rounded-3xl border backdrop-blur-md p-5 ${cardClass}`}>
                    {!signedIn ? (
                        <div className="space-y-3">
                            <p className={`text-sm ${muted}`}>{t('home.fmNeedLogin')}</p>
                            <OnlineMusicGuestConnect onRefreshUser={onRefreshUser} user={user} />
                        </div>
                    ) : currentSong && isFmMode ? (
                        <div className="flex flex-col items-center gap-5 text-center">
                            <div className="h-56 w-56 overflow-hidden rounded-3xl bg-black/10 shadow-lg">
                                {coverUrl ? (
                                    <LazyCoverImage src={coverUrl} alt="" className="h-full w-full object-cover" />
                                ) : null}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-xl font-semibold">{currentSong.name}</div>
                                <div className={`mt-1 truncate text-sm ${muted}`}>{artist}</div>
                            </div>
                            <div className="flex items-center gap-5">
                                <button type="button" onClick={onPrev} className={`rounded-full p-3 ${isDaylight ? 'bg-black/5' : 'bg-white/10'}`}>
                                    <SkipBack size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={onTogglePlay}
                                    className={`flex h-14 w-14 items-center justify-center rounded-full ${isDaylight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
                                >
                                    {playerState === PlayerState.PLAYING ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                                </button>
                                <button type="button" onClick={onNext} className={`rounded-full p-3 ${isDaylight ? 'bg-black/5' : 'bg-white/10'}`}>
                                    <SkipForward size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-8">
                                <button type="button" onClick={onTrash} className={muted}>
                                    <Trash2 size={20} />
                                </button>
                                <button type="button" onClick={onLike} className={isLiked ? 'text-red-500' : muted}>
                                    <Heart size={20} fill={isLiked ? 'currentColor' : 'transparent'} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <p className={`text-sm ${muted}`}>{t('home.fmEmptyHint')}</p>
                            <button
                                type="button"
                                disabled={actionBusy === 'fm'}
                                onClick={() => { void startFm(); }}
                                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${isDaylight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
                            >
                                {actionBusy === 'fm' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                {t('home.featureRoamTitle')}
                            </button>
                        </div>
                    )}
                </div>

                {upcoming.length > 0 ? (
                    <div>
                        <div className="mb-2 text-sm font-semibold">{t('queue.upNext')}</div>
                        <div className="space-y-1">
                            {upcoming.map(song => (
                                <button
                                    key={song.id}
                                    type="button"
                                    onClick={() => onPlaySong(song, playQueue, true)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left ${cardClass}`}
                                >
                                    <LazyCoverImage
                                        src={song.al?.picUrl || song.album?.picUrl || ''}
                                        alt=""
                                        className="h-10 w-10 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{song.name}</div>
                                        <div className={`truncate text-[11px] ${muted}`}>
                                            {(song.ar?.length ? song.ar : song.artists)?.map(item => item.name).join(', ')}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
                </div>
            </div>
        </div>
    );
};

export default FmSurface;
