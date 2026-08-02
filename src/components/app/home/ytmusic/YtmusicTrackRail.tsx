import React from 'react';
import type { YtmSearchTrack } from '../../../../types/ytmusic';

// src/components/app/home/ytmusic/YtmusicTrackRail.tsx
// Horizontal track cards for one YTM home recommendation section.

type YtmusicTrackRailProps = {
    title: string;
    tracks: YtmSearchTrack[];
    queue: YtmSearchTrack[];
    isDaylight: boolean;
    currentVideoId?: string | null;
    seeAllLabel: string;
    onSeeAll?: () => void;
    onPlayTrack: (track: YtmSearchTrack, queue: YtmSearchTrack[]) => void;
};

const YtmusicTrackRail: React.FC<YtmusicTrackRailProps> = ({
    title,
    tracks,
    queue,
    isDaylight,
    currentVideoId = null,
    seeAllLabel,
    onSeeAll,
    onPlayTrack,
}) => {
    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const coverRing = isDaylight
        ? 'ring-1 ring-black/6 group-hover:ring-black/12'
        : 'ring-1 ring-white/8 group-hover:ring-white/16';
    const cardHover = isDaylight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.06]';
    const activeCard = isDaylight
        ? 'bg-black/[0.08] ring-1 ring-black/10'
        : 'bg-white/[0.12] ring-1 ring-white/14';

    return (
        <section className="space-y-2.5">
            <div className="flex items-end justify-between gap-3 px-1">
                <h3 className="min-w-0 truncate text-sm font-semibold tracking-tight">{title}</h3>
                {onSeeAll ? (
                    <button
                        type="button"
                        onClick={onSeeAll}
                        className={`shrink-0 text-xs font-medium transition ${muted} hover:opacity-100 opacity-80`}
                    >
                        {seeAllLabel}
                    </button>
                ) : null}
            </div>
            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                {tracks.map((track) => {
                    const isActive = Boolean(currentVideoId && track.videoId === currentVideoId);
                    return (
                        <button
                            key={track.videoId}
                            type="button"
                            onClick={() => onPlayTrack(track, queue)}
                            className={`group w-[112px] shrink-0 rounded-2xl p-1.5 text-left transition-colors ${cardHover} ${isActive ? activeCard : ''}`}
                            aria-current={isActive ? 'true' : undefined}
                        >
                            <div className={`aspect-square w-full overflow-hidden rounded-xl bg-black/10 ${coverRing}`}>
                                {track.coverUrl ? (
                                    <img
                                        src={track.coverUrl}
                                        alt=""
                                        className="h-full w-full object-contain transition group-hover:scale-[1.02]"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : null}
                            </div>
                            <div className={`mt-2 truncate text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {track.title}
                            </div>
                            <div className={`mt-0.5 truncate text-[11px] ${muted}`}>
                                {track.artist}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default YtmusicTrackRail;
