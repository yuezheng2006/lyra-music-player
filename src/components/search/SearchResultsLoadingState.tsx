import type { FC } from 'react';

// src/components/search/SearchResultsLoadingState.tsx

type SearchLoadingProps = {
    isDaylight: boolean;
    label: string;
};

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

export const SearchProgressLine: FC<SearchLoadingProps> = ({ isDaylight, label }) => (
    <div
        role="progressbar"
        aria-label={label}
        className={`mb-3 h-0.5 w-full overflow-hidden rounded-full ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}
    >
        <div className="h-full w-full animate-pulse rounded-full bg-[#3b82f6]" />
    </div>
);

export const SearchResultsLoadingState: FC<SearchLoadingProps> = ({ isDaylight, label }) => (
    <div className="pt-1" aria-busy="true">
        <SearchProgressLine isDaylight={isDaylight} label={label} />
        <div className="space-y-1.5" aria-hidden="true">
            {SKELETON_ROWS.map(index => (
                <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 md:px-3.5 ${isDaylight ? 'border-black/6 bg-white/70' : 'border-white/8 bg-white/[0.035]'}`}
                >
                    <div className={`h-12 w-12 shrink-0 rounded-lg ${isDaylight ? 'bg-black/[0.055]' : 'bg-white/[0.07]'}`} />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className={`h-3 w-2/5 rounded-full ${isDaylight ? 'bg-black/[0.07]' : 'bg-white/[0.09]'}`} />
                        <div className={`h-2.5 w-3/5 rounded-full ${isDaylight ? 'bg-black/[0.045]' : 'bg-white/[0.055]'}`} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
