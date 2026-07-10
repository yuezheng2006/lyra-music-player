import React from 'react';
import type { OnlineMusicProviderId } from '../../types';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';

// src/components/shared/OnlineProviderBadge.tsx
// Compact source chip for playlist cards and search/result affordances.

export type OnlineProviderVisualId = OnlineMusicProviderId;

type OnlineProviderBadgeProps = {
    provider?: OnlineProviderVisualId | string | null;
    size?: 'sm' | 'md';
    /** solid: brand fill; glass: soft tint that matches home chrome */
    variant?: 'solid' | 'glass';
    className?: string;
};

const PROVIDER_META: Record<OnlineProviderVisualId, {
    short: string;
    solid: string;
    glassDay: string;
    glassNight: string;
}> = {
    netease: {
        short: '网易云',
        solid: 'bg-[#EC4141] text-white shadow-[0_1px_6px_rgba(236,65,65,0.35)]',
        glassDay: 'bg-[#EC4141]/14 text-[#B42323] border border-[#EC4141]/20',
        glassNight: 'bg-[#EC4141]/22 text-[#FFB4B4] border border-white/10',
    },
    qq: {
        short: 'QQ',
        solid: 'bg-[#31C27C] text-white shadow-[0_1px_6px_rgba(49,194,124,0.35)]',
        glassDay: 'bg-[#31C27C]/14 text-[#0F7A4A] border border-[#31C27C]/20',
        glassNight: 'bg-[#31C27C]/22 text-[#9BE7C2] border border-white/10',
    },
    qishui: {
        short: '汽水',
        solid: 'bg-[#2F6BFF] text-white shadow-[0_1px_6px_rgba(47,107,255,0.35)]',
        glassDay: 'bg-[#2F6BFF]/14 text-[#1D4ED8] border border-[#2F6BFF]/20',
        glassNight: 'bg-[#2F6BFF]/22 text-[#B4C8FF] border border-white/10',
    },
    coco: {
        short: 'coco-免费',
        solid: 'bg-[#D97706] text-white shadow-[0_1px_6px_rgba(217,119,6,0.35)]',
        glassDay: 'bg-[#D97706]/14 text-[#B45309] border border-[#D97706]/20',
        glassNight: 'bg-[#D97706]/22 text-[#FCD34D] border border-white/10',
    },
};

export const resolveOnlineProviderVisualId = (
    provider?: string | null,
): OnlineProviderVisualId => {
    if (provider === 'qq') return 'qq';
    if (provider === 'qishui') return 'qishui';
    if (provider === 'coco') return 'coco';
    return 'netease';
};

export const OnlineProviderBadge: React.FC<OnlineProviderBadgeProps & {
    isDaylight?: boolean;
}> = ({
    provider,
    size = 'sm',
    variant = 'solid',
    isDaylight = true,
    className = '',
}) => {
    const id = resolveOnlineProviderVisualId(provider);
    const meta = PROVIDER_META[id];
    const iconUrl = resolveOnlineProviderIconUrl(id);
    const sizeClass = size === 'md'
        ? 'text-[11px] px-2 py-0.5 gap-1'
        : 'text-[10px] px-1.5 py-0.5 gap-0.5';
    const iconClass = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';
    const tone = variant === 'glass'
        ? (isDaylight ? meta.glassDay : meta.glassNight)
        : meta.solid;

    return (
        <span
            className={`inline-flex items-center rounded-full font-semibold tracking-wide backdrop-blur-md ${sizeClass} ${tone} ${className}`}
        >
            {iconUrl ? (
                <img
                    src={iconUrl}
                    alt=""
                    aria-hidden="true"
                    className={`${iconClass} rounded-[3px] object-cover`}
                />
            ) : null}
            {meta.short}
        </span>
    );
};

export default OnlineProviderBadge;
