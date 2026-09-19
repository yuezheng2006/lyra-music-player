import React from 'react';
import { ChevronRight } from 'lucide-react';

// src/components/app/home/HomeShelfHeader.tsx
// Section title with optional drill-in for discovery shelves.

type HomeShelfHeaderProps = {
    title: string;
    subtitle?: string;
    isDaylight: boolean;
    onOpenAll?: () => void;
};

const HomeShelfHeader: React.FC<HomeShelfHeaderProps> = ({
    title,
    subtitle,
    isDaylight,
    onOpenAll,
}) => {
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';
    const titleClass = 'text-sm font-semibold tracking-tight';

    return (
        <div className="mb-2 flex min-w-0 items-end justify-between gap-3">
            <div className="min-w-0">
                {onOpenAll ? (
                    <button
                        type="button"
                        onClick={onOpenAll}
                        className={`inline-flex max-w-full items-center gap-0.5 ${titleClass} hover:opacity-80`}
                    >
                        <span className="truncate">{title}</span>
                        <ChevronRight size={14} className="shrink-0 opacity-55" />
                    </button>
                ) : (
                    <div className={titleClass}>{title}</div>
                )}
                {subtitle ? (
                    <div className={`mt-0.5 truncate text-[11px] ${muted}`}>{subtitle}</div>
                ) : null}
            </div>
        </div>
    );
};

export default HomeShelfHeader;
