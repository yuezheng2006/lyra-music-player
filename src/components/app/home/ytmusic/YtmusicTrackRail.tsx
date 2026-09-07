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
        <section className="space-y-3">
            <div className="flex items-start justify-between gap-4 px-1">
                <h3
                    className="min-w-0 flex-1 text-[15px] font-semibold leading-snug tracking-tight line-clamp-2"
                    title={title}
                >
                    {title}
                </h3>
                {onSeeAll ? (
                    <button
                        type="button"
                        onClick={onSeeAll}
                        className={`mt-0.5 shrink-0 text-xs font-medium transition ${muted} hover:opacity-100 opacity-75`}
                    >
                        {seeAllLabel}
                    </button>
                ) : null}
            </div>
            <div className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pb-1.5 [scrollbar-width:thin]">
                {tracks.map((track) => {
                    const isActive = Boolean(currentVideoId && track.videoId === currentVideoId);
                    return (
                        <button
                            key={track.videoId}
                            type="button"
                            onClick={() => onPlayTrack(track, queue)}
                            className={`group w-[148px] shrink-0 rounded-2xl p-2 text-left transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-[156px] ${cardHover} ${isActive ? activeCard : ''}`}
                            aria-current={isActive ? 'true' : undefined}
                            title={`${track.title}${track.artist ? ` · ${track.artist}` : ''}`}
                        >
                            <div className={`aspect-square w-full overflow-hidden rounded-xl bg-black/10 ${coverRing}`}>
                                {track.coverUrl ? (
                                    <img
                                        src={track.coverUrl}
                                        alt=""
                                        className="h-full w-full object-cover transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : null}
                            </div>
                            <div className={`mt-2.5 line-clamp-2 text-[13px] leading-snug ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {track.title}
                            </div>
                            <div className={`mt-1 truncate text-[11px] leading-tight ${muted}`}>
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
