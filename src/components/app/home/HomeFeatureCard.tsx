import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import LazyCoverImage from '../../shared/LazyCoverImage';

// src/components/app/home/HomeFeatureCard.tsx
// Compact discovery action strip reused by NetEase heartbeat and roam entries.

type HomeFeatureCardProps = {
    isDaylight: boolean;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    coverUrl?: string;
    busy?: boolean;
    disabled?: boolean;
    onClick: () => void;
};

const HomeFeatureCard: React.FC<HomeFeatureCardProps> = ({
    isDaylight,
    title,
    subtitle,
    icon: Icon,
    coverUrl,
    busy = false,
    disabled = false,
    onClick,
}) => {
    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)]'
        : 'bg-white/10 border-white/15 text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)]';
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';

    return (
        <button
            type="button"
            disabled={disabled || busy}
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left disabled:opacity-45 ${cardClass}`}
        >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
                {coverUrl ? (
                    <LazyCoverImage src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : busy ? (
                    <Loader2 size={16} className="animate-spin opacity-70" />
                ) : (
                    <Icon size={18} className="opacity-70" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{title}</div>
                <div className={`mt-0.5 truncate text-[11px] ${muted}`}>{subtitle}</div>
            </div>
        </button>
    );
};

export default HomeFeatureCard;
