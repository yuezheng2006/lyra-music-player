import type { FC } from 'react';

// src/components/search/SearchResultsLoadingState.tsx
// Indeterminate progress + skeleton shimmer while online search is in flight.

type SearchLoadingProps = {
    isDaylight: boolean;
    label: string;
};

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

const skeletonTone = (isDaylight: boolean) => (
    isDaylight ? 'search-skeleton-shimmer-daylight' : 'search-skeleton-shimmer-night'
);

export const SearchProgressLine: FC<SearchLoadingProps> = ({ isDaylight, label }) => (
    <div
        role="progressbar"
        aria-label={label}
        aria-valuetext={label}
        className={`mb-3 h-0.5 w-full overflow-hidden rounded-full ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}
    >
        <div className="search-progress-indeterminate h-full rounded-full bg-[#3b82f6]" />
    </div>
);

export const SearchResultsLoadingState: FC<SearchLoadingProps> = ({ isDaylight, label }) => {
    const shimmer = `search-skeleton-shimmer ${skeletonTone(isDaylight)}`;

    return (
        <div className="pt-1" aria-busy="true">
            <SearchProgressLine isDaylight={isDaylight} label={label} />
            <div className="space-y-1.5" aria-hidden="true">
                {SKELETON_ROWS.map(index => (
                    <div
                        key={index}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 md:px-3.5 ${isDaylight ? 'border-black/6 bg-white/70' : 'border-white/8 bg-white/[0.035]'}`}
                    >
                        <div className={`h-12 w-12 shrink-0 rounded-lg ${shimmer}`} />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className={`h-3 w-2/5 rounded-full ${shimmer}`} />
                            <div className={`h-2.5 w-3/5 rounded-full ${shimmer}`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
