import React from 'react';
import type { OnlineMusicProviderId } from '../../types';
import LazyCoverImage, { type LazyCoverPlaceholderVariant } from './LazyCoverImage';
import { OnlineProviderBadge } from './OnlineProviderBadge';

// src/components/shared/HomeShelfCard.tsx
// Compact home shelf tile: cover art, title, optional subtitle and provider badge.

export type HomeShelfCardProps = {
    title: string;
    subtitle?: string;
    coverUrl?: string;
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
            className={`group relative w-full text-left overflow-hidden rounded-[18px] border backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none ${shell}`}
        >
            <div className="relative aspect-square overflow-hidden">
                <LazyCoverImage
                    src={coverUrl}
                    alt={title}
                    placeholderLabel={title}
                    placeholderVariant={placeholderVariant}
                    sizePx={320}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${coverWash}`} />
                {provider ? (
                    <OnlineProviderBadge
                        provider={provider}
                        variant="glass"
                        showIcon={false}
                        isDaylight={isDaylight}
                        className="absolute top-2 left-2 z-10"
                    />
                ) : null}
            </div>

            <div className={`px-2.5 pt-2 pb-2 min-w-0 ${isDaylight ? 'bg-white/35' : 'bg-white/[0.03]'}`}>
                <div className={`truncate text-[12px] font-semibold leading-snug tracking-tight ${titleTone}`}>
                    {title}
                </div>
                {subtitle ? (
                    <div className={`mt-0.5 truncate text-[10px] leading-snug ${metaTone}`}>
                        {subtitle}
                    </div>
                ) : (
                    <div className="mt-0.5 h-[10px]" />
                )}
            </div>
        </button>
    );
};

export default HomeShelfCard;
