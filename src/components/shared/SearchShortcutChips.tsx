import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OnlineSearchShortcutGroup } from '../../utils/onlineSearchShortcuts';
import { stripShortcutDisplayLabel } from '../../utils/onlineSearchShortcuts';
import { ShortcutChip } from './ShortcutChip';

// src/components/shared/SearchShortcutChips.tsx
// Empty-state text shortcuts for peer search channels (no cover art).

type SearchShortcutChipsProps = {
    groups: readonly OnlineSearchShortcutGroup[];
    isDaylight: boolean;
    disabled?: boolean;
    hintKey?: string;
    hintFallback?: string;
    onSelect: (query: string) => void;
};

const GROUP_LABEL_KEY: Record<OnlineSearchShortcutGroup['id'], string> = {
    hot: 'search.hotSearches',
    common: 'search.commonSearches',
    accounts: 'search.aiAccountSearches',
    category: 'search.categorySearches',
    song: 'search.songSearches',
    artist: 'search.artistSearches',
};

const GROUP_LABEL_FALLBACK: Record<OnlineSearchShortcutGroup['id'], string> = {
    hot: 'Popular searches',
    common: 'Common searches',
    accounts: 'Popular AI accounts',
    category: 'Search by category',
    song: 'Search by song',
    artist: 'Search by artist',
};

export const SearchShortcutChips: React.FC<SearchShortcutChipsProps> = ({
    groups,
    isDaylight,
    disabled = false,
    hintKey = 'search.shortcutsHint',
    hintFallback = 'Placeholder suggestions — tap to search',
    onSelect,
}) => {
    const { t } = useTranslation();

    if (groups.length === 0) return null;

    const mutedText = isDaylight ? 'text-black/55' : 'text-white/60';
    const headingText = isDaylight ? 'text-slate-900' : 'text-white';

    return (
        <div className="flex flex-col gap-5 py-6 md:py-8">
            {groups.map(group => (
                <section key={group.id} className="min-w-0">
                    <h2 className={`text-xs font-semibold tracking-wide uppercase ${mutedText}`}>
                        {t(GROUP_LABEL_KEY[group.id], GROUP_LABEL_FALLBACK[group.id])}
                    </h2>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        {group.queries.map(query => {
                            const displayLabel = stripShortcutDisplayLabel(query);
                            return (
                                <ShortcutChip
                                    key={`${group.id}-${query}`}
                                    label={displayLabel}
                                    isDaylight={isDaylight}
                                    disabled={disabled}
                                    onSelect={() => onSelect(query)}
                                />
                            );
                        })}
                    </div>
                </section>
            ))}
            <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                {t(hintKey, hintFallback)}
            </p>
        </div>
    );
};

export default SearchShortcutChips;
