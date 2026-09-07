import React from 'react';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';

// src/components/shared/OnlineProviderMark.tsx
// Brand mark for source chips and login rows. QQ is a circle on transparent, not a nested tile.

type OnlineProviderMarkProps = {
    provider: string;
    size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASS = {
    sm: 'h-4 w-4 rounded-[5px]',
    md: 'h-8 w-8 rounded-lg',
    lg: 'h-10 w-10 rounded-xl',
} as const;

const CONTAIN_PROVIDERS = new Set(['qq']);

export const OnlineProviderMark: React.FC<OnlineProviderMarkProps> = ({
    provider,
    size = 'md',
}) => {
    const iconUrl = resolveOnlineProviderIconUrl(provider);
    if (!iconUrl) return null;
    const contain = CONTAIN_PROVIDERS.has(provider);
    return (
        <span className={`${SIZE_CLASS[size]} inline-flex shrink-0 overflow-hidden`}>
            <img
                src={iconUrl}
                alt=""
                aria-hidden="true"
                className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'}`}
            />
        </span>
    );
};

export default OnlineProviderMark;
