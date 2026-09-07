import React, { useMemo } from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../../types';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import { playDiscoverySongs } from '../../../utils/home/startNeteaseDiscoveryPlayback';
import { joinListeningDeskSourceLabels } from '../../../utils/ui/homeProviderFilterMath';
import {
    listeningDeskMosaicLimit,
    type ListeningDeskFieldMode,
} from '../../../utils/home/listeningDeskMath';
import { useListeningDeskModel } from '../../../hooks/useListeningDeskModel';
import HomeListeningMosaic from './HomeListeningMosaic';

// src/components/app/home/HomeListeningDesk.tsx
// Stage is a compact bento; strip sits above personal playlists after login.

type HomeListeningDeskProps = {
    isDaylight: boolean;
    mode?: ListeningDeskFieldMode;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
};

const DESK_SOURCE_LABEL_KEY: Record<string, string> = {
    qq: 'home.qqMusicProvider',
    qishui: 'home.qishuiProvider',
    coco: 'home.cocoProvider',
    kugou: 'home.kugouProvider',
    bilibili: 'home.bilibiliProvider',
    kuwo: 'home.kuwoProvider',
};

const HomeListeningDesk: React.FC<HomeListeningDeskProps> = ({
    isDaylight,
    mode = 'strip',
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const {
        songs,
        mosaic,
        showLoading,
        showEmpty,
        emptyNeedsSources,
        enabledDeskProviderIds,
    } = useListeningDeskModel();

    const sourceLine = useMemo(
        () => joinListeningDeskSourceLabels(
            enabledDeskProviderIds.map(id => t(DESK_SOURCE_LABEL_KEY[id] || id)),
        ),
        [enabledDeskProviderIds, t],
    );

    const visibleMosaic = mosaic.slice(0, listeningDeskMosaicLimit(mode));
    const muted = isDaylight ? 'text-zinc-600' : 'text-white/58';
    const playClass = isDaylight
        ? 'bg-zinc-900 text-white disabled:bg-zinc-900/30'
        : 'bg-white text-zinc-950 disabled:bg-white/30';
    const statusText = emptyNeedsSources
        ? t('home.listeningDeskNoSources')
        : showLoading
            ? t('home.listeningDeskLoading', { sources: sourceLine })
            : showEmpty
                ? t('home.listeningDeskEmpty')
                : t('home.listeningDeskReady', { sources: sourceLine, count: songs.length });

    return (
        <section
            className="shrink-0"
            data-app-ui-surface="home-listening-desk"
        >
            <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold tracking-tight">
                        {t('home.listeningDeskTitle')}
                        <span className={`ml-2 text-[11px] font-medium ${muted}`}>
                            {t('home.listeningDeskKicker')}
                        </span>
                    </h2>
                    <p className={`truncate text-[11px] ${muted}`}>{statusText}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        disabled={songs.length === 0}
                        onClick={() => playDiscoverySongs(songs, onPlaySong)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${playClass}`}
                    >
                        <Play size={12} fill="currentColor" />
                        {t('home.dailyMixPlay')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setHomeViewTab('daily')}
                        className={`rounded-full px-2.5 py-1.5 text-[12px] font-medium ${muted}`}
                    >
                        {t('home.dailyMixViewAll')}
                    </button>
                </div>
            </div>

            <HomeListeningMosaic
                songs={visibleMosaic}
                queue={songs}
                isDaylight={isDaylight}
                mode={mode}
                skeleton={mosaic.length === 0 && (showLoading || emptyNeedsSources || showEmpty)}
                onPlaySong={onPlaySong}
            />
        </section>
    );
};

export default HomeListeningDesk;
