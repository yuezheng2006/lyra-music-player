import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShortcutChip } from '../../shared/ShortcutChip';
import { stripShortcutDisplayLabel } from '../../../utils/onlineSearchShortcuts';
import { resolveLandingHotSearchQueries } from '../../../utils/home/resolveLandingHotSearchQueries';

// src/components/app/home/HomeSearchHotTags.tsx
// Coco-downloader empty chrome: one row of hot queries under the search pill.

type HomeSearchHotTagsProps = {
    isDaylight: boolean;
    provider?: string | null;
    disabled?: boolean;
    onSelect: (query: string) => void;
};

const HomeSearchHotTags: React.FC<HomeSearchHotTagsProps> = ({
    isDaylight,
    provider,
    disabled = false,
    onSelect,
}) => {
    const { t } = useTranslation();
    const queries = useMemo(() => resolveLandingHotSearchQueries(provider), [provider]);
    const muted = isDaylight ? 'text-black/45' : 'text-white/45';

    if (queries.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5" data-app-ui-surface="home-search-hot-tags">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${muted}`}>
                <Flame size={12} className="shrink-0 text-orange-500" aria-hidden />
                {t('search.hotSearches')}
            </span>
            {queries.map(query => (
                <ShortcutChip
                    key={query}
                    label={stripShortcutDisplayLabel(query)}
                    isDaylight={isDaylight}
                    disabled={disabled}
                    onSelect={() => onSelect(query)}
                />
            ))}
        </div>
    );
};

export default HomeSearchHotTags;
