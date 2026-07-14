import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OnlineSearchShortcutGroup } from '../../utils/onlineSearchShortcuts';

// src/components/shared/SearchShortcutChips.tsx
// Empty-state chips for popular / common peer-channel search queries.

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
};

const GROUP_LABEL_FALLBACK: Record<OnlineSearchShortcutGroup['id'], string> = {
    hot: 'Popular searches',
    common: 'Common searches',
    accounts: 'Popular AI accounts',
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

    const headingText = isDaylight ? 'text-slate-900' : 'text-white';
    const mutedText = isDaylight ? 'text-black/55' : 'text-white/60';
    const chipClass = isDaylight
        ? 'border-black/10 bg-white/90 text-slate-700 hover:bg-slate-50 hover:border-black/16'
        : 'border-white/12 bg-white/8 text-white/85 hover:bg-white/14 hover:border-white/20';

    return (
        <div className="flex flex-col gap-5 py-6 md:py-8">
            {groups.map(group => (
                <section key={group.id} className="min-w-0">
                    <h2 className={`text-xs font-semibold tracking-wide uppercase ${mutedText}`}>
                        {t(GROUP_LABEL_KEY[group.id], GROUP_LABEL_FALLBACK[group.id])}
                    </h2>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        {group.queries.map(query => (
                            <button
                                key={`${group.id}-${query}`}
                                type="button"
                                disabled={disabled}
                                onClick={() => onSelect(query)}
                                className={`inline-flex items-center min-h-9 rounded-full border px-3.5 py-1.5 text-sm transition-colors touch-manipulation active:scale-[0.98] disabled:opacity-50 ${chipClass}`}
                            >
                                <span className={headingText}>{query}</span>
                            </button>
                        ))}
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
