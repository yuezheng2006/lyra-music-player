import { Clock3, X } from 'lucide-react';
import type { FC } from 'react';
import type { RecentSearchEntry } from '../../utils/search/recentSearchHistory';

// src/components/search/RecentSearchChips.tsx

type RecentSearchChipsProps = {
    entries: RecentSearchEntry[];
    isDaylight: boolean;
    /** When true, chips and clear stay inert (default: always interactive). */
    disabled?: boolean;
    label: string;
    clearLabel: string;
    onSelect: (entry: RecentSearchEntry) => void;
    onClear: () => void;
};

export const RecentSearchChips: FC<RecentSearchChipsProps> = ({
    entries,
    isDaylight,
    disabled = false,
    label,
    clearLabel,
    onSelect,
    onClear,
}) => {
    if (entries.length === 0) return null;

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const chip = isDaylight
        ? 'border-black/8 bg-black/[0.035] text-black/65 hover:bg-black/[0.07]'
        : 'border-white/8 bg-white/[0.045] text-white/65 hover:bg-white/[0.09]';

    return (
        <div className="mt-2 flex min-w-0 items-start gap-2 px-1">
            <div className={`mt-1.5 flex shrink-0 items-center gap-1 text-[11px] ${muted}`}>
                <Clock3 size={12} />
                <span>{label}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {entries.map(entry => (
                    <button
                        key={entry.query}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(entry)}
                        className={`max-w-48 truncate rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:cursor-default disabled:opacity-45 ${chip}`}
                        title={entry.displayQuery}
                    >
                        {entry.displayQuery}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={onClear}
                className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-colors ${muted} ${isDaylight ? 'hover:bg-black/5' : 'hover:bg-white/8'}`}
                aria-label={clearLabel}
            >
                <X size={11} />
                <span>{clearLabel}</span>
            </button>
        </div>
    );
};
