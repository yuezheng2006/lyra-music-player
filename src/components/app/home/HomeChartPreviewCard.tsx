import React from 'react';
import { useTranslation } from 'react-i18next';
import LazyCoverImage from '../../shared/LazyCoverImage';
import type { OfficialChartPreviewTrack } from '../../../utils/charts/officialChartMath';

// src/components/app/home/HomeChartPreviewCard.tsx
// One official-chart Top 3 card: chrome opens charts, a row plays that track.

type HomeChartPreviewCardProps = {
    isDaylight: boolean;
    title: string;
    themeLabel: string;
    coverUrl?: string;
    tracks: OfficialChartPreviewTrack[];
    loading: boolean;
    playingIndex: number | null;
    onOpenChart: () => void;
    onPlayRow: (index: number) => void;
};

const HomeChartPreviewCard: React.FC<HomeChartPreviewCardProps> = ({
    isDaylight,
    title,
    themeLabel,
    coverUrl,
    tracks,
    loading,
    playingIndex,
    onOpenChart,
    onPlayRow,
}) => {
    const { t } = useTranslation();
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';
    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)]'
        : 'bg-white/10 border-white/15 text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)]';
    const rows = tracks.length > 0 ? tracks.slice(0, 3) : [0, 1, 2];

    return (
        <div className={`rounded-xl border p-2 backdrop-blur-md ${cardClass}`}>
            <div className="flex min-w-0 gap-2.5">
                <button
                    type="button"
                    onClick={onOpenChart}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/10 hover:opacity-80"
                    title={title}
                >
                    <LazyCoverImage
                        src={coverUrl}
                        alt={title}
                        placeholderLabel={title}
                        placeholderVariant="playlist"
                        sizePx={128}
                        className="h-full w-full object-cover"
                    />
                </button>
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={onOpenChart}
                        className="flex w-full items-baseline justify-between gap-2 text-left hover:opacity-80"
                    >
                        <div className="truncate text-[13px] font-semibold">{title}</div>
                        <div className={`shrink-0 text-[10px] ${muted}`}>{themeLabel}</div>
                    </button>
                    <div className={`mt-0.5 text-[10px] ${muted}`}>{t('home.chartUpdatedDaily')}</div>
                    <ol className="mt-1.5 space-y-1">
                        {rows.map((track, index) => {
                            if (typeof track === 'number') {
                                return (
                                    <li key={`skel-${index}`} className={`truncate text-[11px] ${muted}`}>
                                        {loading ? t('home.chartLoading') : '—'}
                                    </li>
                                );
                            }
                            const busy = playingIndex === index;
                            return (
                                <li key={`${track.name}-${index}`}>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => onPlayRow(index)}
                                        title={`${track.name}${track.artist ? ` · ${track.artist}` : ''}`}
                                        className={`flex w-full min-w-0 items-baseline text-left text-[11px] hover:opacity-80 disabled:opacity-55 ${
                                            busy ? 'opacity-70' : ''
                                        }`}
                                    >
                                        <span className={`mr-1.5 tabular-nums ${muted}`}>{index + 1}</span>
                                        <span className="min-w-0 truncate">
                                            <span className="font-medium">{track.name}</span>
                                            {track.artist ? (
                                                <span className={`ml-1 ${muted}`}>{track.artist}</span>
                                            ) : null}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default HomeChartPreviewCard;
