import React from 'react';
import { Play } from 'lucide-react';
import type { OnlineMusicProviderId } from '../../types';
import LazyCoverImage, { type LazyCoverPlaceholderVariant } from './LazyCoverImage';
import { OnlineProviderBadge } from './OnlineProviderBadge';

// src/components/shared/HomeShelfCard.tsx
// Compact home shelf tile: cover art, title, optional subtitle and provider badge.

export type HomeShelfCardProps = {
    title: string;
    subtitle?: string;
    coverUrl?: string;
    coverBadge?: string;
    placeholderVariant?: LazyCoverPlaceholderVariant;
    provider?: OnlineMusicProviderId;
    isDaylight: boolean;
    disabled?: boolean;
    onSelect: () => void;
};

export const HomeShelfCard: React.FC<HomeShelfCardProps> = ({
    title,
    subtitle,
    coverUrl,
    coverBadge,
    placeholderVariant = 'playlist',
    provider,
    isDaylight,
    disabled = false,
    onSelect,
}) => {
    const shell = isDaylight
        ? 'bg-white/55 border-white/70 shadow-[0_8px_22px_rgba(0,0,0,0.05)] hover:bg-white/75 hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)]'
        : 'bg-white/[0.07] border-white/10 shadow-[0_10px_26px_rgba(0,0,0,0.26)] hover:bg-white/[0.11] hover:shadow-[0_14px_32px_rgba(0,0,0,0.34)]';
    const metaTone = isDaylight ? 'text-black/42' : 'text-white/42';
    const titleTone = isDaylight ? 'text-black/88' : 'text-white/92';
    const coverWash = isDaylight
        ? 'from-transparent via-transparent to-black/[0.04]'
        : 'from-transparent via-transparent to-black/35';

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            title={subtitle ? `${title} · ${subtitle}` : title}
            className={`group relative w-full text-left overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none ${shell}`}
        >
            <div className="relative aspect-square overflow-hidden">
                <LazyCoverImage
                    src={coverUrl}
                    alt={title}
                    placeholderLabel={title}
                    placeholderVariant={placeholderVariant}
                    sizePx={160}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${coverWash}`} />
                {provider ? (
                    <OnlineProviderBadge
                        provider={provider}
                        variant="glass"
                        showIcon={false}
                        isDaylight={isDaylight}
                        className="absolute top-1 left-1 z-10"
                    />
                ) : null}
                {coverBadge ? (
                    <span className="absolute top-1 right-1 z-10 rounded-full bg-black/55 px-1 py-px text-[9px] font-medium tabular-nums text-white/95 backdrop-blur-sm">
                        {coverBadge}
                    </span>
                ) : null}
                <span className="absolute bottom-1 right-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                    <Play size={11} fill="currentColor" />
                </span>
            </div>

            <div className={`px-1.5 pt-1.5 pb-1.5 min-w-0 ${isDaylight ? 'bg-white/35' : 'bg-white/[0.03]'}`}>
                <div className={`truncate text-[11px] font-semibold leading-snug tracking-tight ${titleTone}`}>
                    {title}
                </div>
                {subtitle ? (
                    <div className={`mt-px truncate text-[9px] leading-snug ${metaTone}`}>
                        {subtitle}
                    </div>
                ) : (
                    <div className="mt-px h-[9px]" />
                )}
            </div>
        </button>
    );
};

export default HomeShelfCard;
