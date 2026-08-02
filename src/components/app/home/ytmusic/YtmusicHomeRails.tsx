import React from 'react';
import { useTranslation } from 'react-i18next';
import type { YtmHomePlaylist, YtmHomeSection, YtmSearchTrack } from '../../../../types/ytmusic';
import RemoteLoadState from '../../../shared/RemoteLoadState';
import { buildYtmusicHomeRails } from '../../../../utils/ytmusicHomeRailsMath';
import YtmusicTrackRail from './YtmusicTrackRail';

// src/components/app/home/ytmusic/YtmusicHomeRails.tsx
// Empty-state YTM home: horizontal track rails from expanded seed playlists.

type YtmusicHomeRailsProps = {
    sections: YtmHomeSection[];
    loading: boolean;
    error: string | null;
    diagnostic: string | null;
    isEmpty: boolean;
    isDaylight: boolean;
    currentVideoId?: string | null;
    onRetry: () => void;
    onSeeAll: (playlist: YtmHomePlaylist) => void;
    onPlayTrack: (track: YtmSearchTrack, queue: YtmSearchTrack[]) => void;
};

const YtmusicHomeRails: React.FC<YtmusicHomeRailsProps> = ({
    sections,
    loading,
    error,
    diagnostic,
    isEmpty,
    isDaylight,
    currentVideoId = null,
    onRetry,
    onSeeAll,
    onPlayTrack,
}) => {
    const { t } = useTranslation();
    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const rails = buildYtmusicHomeRails(sections);

    if (loading && sections.length === 0) {
        return (
            <RemoteLoadState
                status="loading"
                isDaylight={isDaylight}
                loadingLabel={t('ytmusic.homeLoading')}
                className="min-h-[140px]"
            />
        );
    }

    if (error && sections.length === 0) {
        return (
            <RemoteLoadState
                status={isEmpty ? 'empty' : 'error'}
                isDaylight={isDaylight}
                emptyLabel={t('ytmusic.homeEmpty')}
                errorLabel={error || t('ytmusic.homeFailed')}
                onRetry={onRetry}
                diagnostic={diagnostic}
                className="min-h-[140px]"
            />
        );
    }

    return (
        <div className="space-y-5">
            <div className="space-y-1 px-1">
                <h2 className="text-sm font-semibold tracking-tight">
                    {t('ytmusic.homeRailsHeading')}
                </h2>
                <p className={`text-xs leading-relaxed ${muted}`}>
                    {t('ytmusic.homeRailsCaption')}
                </p>
            </div>
            {rails.map((rail) => (
                <YtmusicTrackRail
                    key={rail.playlistId}
                    title={rail.title}
                    tracks={rail.visibleTracks}
                    queue={rail.tracks}
                    isDaylight={isDaylight}
                    currentVideoId={currentVideoId}
                    seeAllLabel={t('ytmusic.seeAll')}
                    onSeeAll={() => onSeeAll({
                        title: rail.title,
                        playlistId: rail.playlistId,
                        coverUrl: rail.coverUrl,
                    })}
                    onPlayTrack={onPlayTrack}
                />
            ))}
        </div>
    );
};

export default YtmusicHomeRails;
