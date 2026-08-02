import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { OnlineMusicProviderId } from '../../../types';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import { UNIFIED_ACCOUNT_PROVIDERS } from '../../../utils/musicAccounts/unifiedMusicAccountProviders';
import { isCuratedPeerFreeProviderId } from '../../../utils/onlinePeerProviders';

// src/components/app/home/HomePlatformPicksEntry.tsx
// Platform Picks entry — jump into enabled sources (no Mineradio overlay).

type HomePlatformPicksEntryProps = {
    isDaylight: boolean;
    onOpenAccount?: () => void;
};

const HomePlatformPicksEntry: React.FC<HomePlatformPicksEntryProps> = ({
    isDaylight,
    onOpenAccount,
}) => {
    const { t } = useTranslation();
    const { playlistProviders, setSearchProvider } = useOnlineLibraryFilterStore(useShallow((s) => ({
        playlistProviders: s.playlistProviders,
        setSearchProvider: s.setSearchProvider,
    })));
    const openPeerSearchChannel = useSearchNavigationStore((s) => s.openPeerSearchChannel);
    const restoreSearch = useSearchNavigationStore((s) => s.restoreSearch);

    const visibleProviders = useMemo(
        () => UNIFIED_ACCOUNT_PROVIDERS.filter((item) => playlistProviders[item.id] !== false),
        [playlistProviders],
    );

    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)]'
        : 'bg-white/10 border-white/15 text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)]';
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';
    const chipClass = isDaylight
        ? 'bg-black/[0.05] hover:bg-black/[0.09] text-zinc-800'
        : 'bg-white/10 hover:bg-white/15 text-white';

    const openProvider = (id: OnlineMusicProviderId) => {
        setSearchProvider(id);
        if (isCuratedPeerFreeProviderId(id)) {
            openPeerSearchChannel({
                sourceTab: id,
                returnView: 'home',
            });
            return;
        }
        restoreSearch({
            query: '',
            sourceTab: id,
            returnView: 'home',
            providers: [id],
        });
    };

    return (
        <div className={`rounded-2xl border backdrop-blur-md p-3.5 flex flex-col gap-3 min-h-[132px] ${cardClass}`}>
            <div>
                <div className={`text-[10px] font-bold tracking-[0.14em] uppercase ${muted}`}>
                    Platform Picks
                </div>
                <div className="mt-0.5 text-sm font-semibold">
                    {t('home.platformPicksTitle') || '平台推荐'}
                </div>
                <div className={`mt-0.5 text-[11px] ${muted}`}>
                    {t('home.platformPicksSubtitle') || '从已展示的音乐源快速搜索'}
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {visibleProviders.map((provider) => (
                    <button
                        key={provider.id}
                        type="button"
                        onClick={() => openProvider(provider.id)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${chipClass}`}
                    >
                        <span className="opacity-60 mr-1">{provider.badge}</span>
                        {t(provider.titleKey)}
                    </button>
                ))}
            </div>

            {onOpenAccount && (
                <div className="mt-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenAccount}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                            isDaylight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/15'
                        }`}
                    >
                        {t('home.platformPicksManage') || '管理账号接入'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomePlatformPicksEntry;
