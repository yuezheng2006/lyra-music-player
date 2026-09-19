import React from 'react';
import { Play } from 'lucide-react';
import LazyCoverImage from '../../shared/LazyCoverImage';

// src/components/app/home/HomePortraitPlaylistCard.tsx
// Discover-shelf portrait tile: cover fills the card, title sits on the wash.

type HomePortraitPlaylistCardProps = {
    title: string;
    coverUrl?: string;
    coverBadge?: string;
    isDaylight: boolean;
    disabled?: boolean;
    onSelect: () => void;
};

const HomePortraitPlaylistCard: React.FC<HomePortraitPlaylistCardProps> = ({
    title,
    coverUrl,
    coverBadge,
    isDaylight,
    disabled = false,
    onSelect,
}) => {
    const shell = isDaylight
        ? 'bg-black/5 shadow-[0_8px_22px_rgba(0,0,0,0.08)]'
        : 'bg-white/[0.06] shadow-[0_10px_26px_rgba(0,0,0,0.28)]';

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            title={title}
            className={`group relative h-[220px] w-[148px] shrink-0 overflow-hidden rounded-2xl text-left ${shell} disabled:pointer-events-none disabled:opacity-50`}
        >
            <LazyCoverImage
                src={coverUrl}
                alt={title}
                placeholderLabel={title}
                placeholderVariant="playlist"
                sizePx={240}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            {coverBadge ? (
                <span className="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white/95 backdrop-blur-sm">
                    {coverBadge}
                </span>
            ) : null}
            <span className="absolute bottom-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                <Play size={13} fill="currentColor" />
            </span>
            <div className="absolute inset-x-2.5 bottom-2.5 z-10 min-w-0">
                <div className="line-clamp-2 text-[12px] font-semibold leading-snug text-white drop-shadow-sm">
                    {title}
                </div>
            </div>
        </button>
    );
};

export default HomePortraitPlaylistCard;
