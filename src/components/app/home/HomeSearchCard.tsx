import React, { useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { hasNeteaseSession, hasQQMusicSession } from '../../../utils/onlineLibraryAccess';
import { resolveSearchableLibraryProviders } from '../../../utils/onlineSearchRouting';
import { resolveHomeSearchPlaceholderKey } from '../../../utils/home/resolveHomeSearchPlaceholderKey';
import { stripShortcutDisplayLabel } from '../../../utils/onlineSearchShortcuts';
import { SearchClearButton } from '../../shared/SearchClearButton';
import OnlineProviderFilterBar from '../../shared/OnlineProviderFilterBar';
import HomeSearchHotTags from './HomeSearchHotTags';
import type { NeteaseUser } from '../../../types';

// src/components/app/home/HomeSearchCard.tsx
// Search-first chrome: pill + source chips + Coco-style hot tags. Empty submit stays on charts.

type HomeSearchCardProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    onCommitSearch: (query: string, allowEmptyChannel?: boolean) => void;
};

const HomeSearchCard: React.FC<HomeSearchCardProps> = ({
    isDaylight,
    user,
    onCommitSearch,
}) => {
    const { t } = useTranslation();
    const {
        homeSearchQuery,
        setHomeSearchQuery,
        isSearching,
    } = useSearchNavigationStore(useShallow(state => ({
        homeSearchQuery: state.homeSearchQuery,
        setHomeSearchQuery: state.setHomeSearchQuery,
        isSearching: state.isSearching,
    })));
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const knownProviderIds = useOnlineLibraryFilterStore(state => state.knownProviderIds);
    const searchProvider = useOnlineLibraryFilterStore(state => state.searchProvider);
    const neteaseConnected = hasNeteaseSession(user);
    const qqConnected = hasQQMusicSession();
    const searchableProviders = useMemo(
        () => resolveSearchableLibraryProviders(playlistProviders, {
            netease: neteaseConnected,
            qq: qqConnected,
        }, knownProviderIds),
        [knownProviderIds, neteaseConnected, playlistProviders, qqConnected],
    );
    const placeholder = t(resolveHomeSearchPlaceholderKey(searchableProviders));
    const inputClass = isDaylight
        ? 'bg-black/5 focus:bg-black/10 border-black/10 focus:border-black/20'
        : 'bg-white/5 focus:bg-white/10 border-white/10 focus:border-white/20';

    const handleSubmit = (event?: React.FormEvent) => {
        event?.preventDefault();
        onCommitSearch(homeSearchQuery, false);
    };

    return (
        <div data-app-ui-surface="home-source-search" className="space-y-2">
            <form onSubmit={handleSubmit} className="relative">
                {isSearching ? (
                    <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin opacity-40" />
                ) : (
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer opacity-40 hover:opacity-100"
                        onClick={() => handleSubmit()}
                    />
                )}
                <input
                    type="text"
                    placeholder={placeholder}
                    value={homeSearchQuery}
                    onChange={event => setHomeSearchQuery(event.target.value)}
                    className={`w-full rounded-full border py-2.5 pl-10 pr-9 text-sm focus:outline-none ${inputClass}`}
                    style={{ color: 'var(--text-primary)' }}
                />
                <SearchClearButton
                    visible={Boolean(homeSearchQuery)}
                    onClear={() => setHomeSearchQuery('')}
                    label={t('app.clearSearch')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                />
            </form>
            <OnlineProviderFilterBar
                layout="flush"
                neteaseConnected={neteaseConnected}
                qqConnected={qqConnected}
            />
            <HomeSearchHotTags
                isDaylight={isDaylight}
                provider={searchProvider}
                disabled={isSearching}
                onSelect={(query) => {
                    setHomeSearchQuery(stripShortcutDisplayLabel(query));
                    onCommitSearch(query, false);
                }}
            />
        </div>
    );
};

export default HomeSearchCard;
