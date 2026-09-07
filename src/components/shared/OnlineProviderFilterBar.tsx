import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    useOnlineLibraryFilterStore,
    type OnlineLibraryModuleFilter,
    type OnlineLibraryProviderId,
} from '../../stores/useOnlineLibraryFilterStore';
import { useMusicProviderCatalogStore } from '../../stores/useMusicProviderCatalogStore';
import { resolveProviderDisplayLabel } from '../../utils/musicProviders/providerManifestMath';
import {
    visibleListeningDeskProviderIds,
    visiblePersonalLibraryProviderIds,
} from '../../utils/ui/homeProviderFilterMath';
import { OnlineProviderMark } from './OnlineProviderMark';

// src/components/shared/OnlineProviderFilterBar.tsx
// Toggle which catalogs feed the listening desk / search. Login lives in the library invite.

type OnlineProviderFilterBarProps = {
    neteaseConnected: boolean;
    qqConnected: boolean;
    onRefreshUser?: () => void;
    /** Flush chips sit inside the source-search card; toolbar is the standalone home row. */
    layout?: 'toolbar' | 'flush';
};

const peerPillClass = (enabled: boolean, isDaylight: boolean) => {
    if (enabled) {
        return isDaylight
            ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/10'
            : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/40';
    }
    return isDaylight
        ? 'bg-black/[0.04] text-black/55 hover:text-black/85 hover:bg-black/[0.08]'
        : 'bg-white/[0.08] text-white/78 hover:text-white hover:bg-white/14';
};

const modulePillClass = (active: boolean, isDaylight: boolean) => {
    if (active) {
        return isDaylight
            ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
            : 'bg-white text-zinc-950 shadow-sm';
    }
    return isDaylight
        ? 'text-black/55 hover:text-black/80'
        : 'text-white/78 hover:text-white';
};

const OnlineProviderFilterBar: React.FC<OnlineProviderFilterBarProps> = ({
    neteaseConnected,
    qqConnected,
    layout = 'toolbar',
}) => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const {
        playlistProviders,
        moduleFilter,
        knownProviderIds,
        togglePlaylistProvider,
        setModuleFilter,
        setSearchProvider,
    } = useOnlineLibraryFilterStore();
    const catalogProviders = useMusicProviderCatalogStore(state => state.providers);

    const builtInLabels: Partial<Record<string, string>> = {
        netease: t('home.neteaseProvider'),
        qq: t('home.qqMusicProvider'),
        qishui: t('home.qishuiProvider'),
        coco: t('home.cocoProvider'),
        kugou: t('home.kugouProvider'),
        bilibili: t('home.bilibiliProvider'),
        kuwo: t('home.kuwoProvider'),
    };

    const resolveLabel = (id: OnlineLibraryProviderId) =>
        resolveProviderDisplayLabel(id, catalogProviders, builtInLabels);

    const isConnected = (id: OnlineLibraryProviderId) => {
        if (id === 'netease') return neteaseConnected;
        if (id === 'qq') return qqConnected;
        return true;
    };

    const deskIds = visibleListeningDeskProviderIds(knownProviderIds, isConnected);
    const libraryIds = visiblePersonalLibraryProviderIds(knownProviderIds, isConnected);
    const showModuleFilter = libraryIds.some(id => playlistProviders[id]);

    useEffect(() => {
        if (!showModuleFilter && moduleFilter !== 'all') {
            setModuleFilter('all');
        }
    }, [moduleFilter, setModuleFilter, showModuleFilter]);

    const modulePills: Array<{ id: OnlineLibraryModuleFilter; label: string }> = [
        { id: 'all', label: t('home.moduleAll') },
        { id: 'created', label: t('home.moduleCreated') },
        { id: 'liked', label: t('home.moduleLiked') },
    ];

    const labelClass = isDaylight ? 'text-black/45' : 'text-white/58';
    const hintClass = isDaylight ? 'text-black/38' : 'text-white/42';
    const shellClass = isDaylight ? 'bg-black/5' : 'bg-white/[0.08]';

    const handleToggle = (id: OnlineLibraryProviderId) => {
        togglePlaylistProvider(id);
        if (!playlistProviders[id]) {
            setSearchProvider(id);
        }
    };

    const renderPills = (ids: readonly OnlineLibraryProviderId[]) => ids.map(id => {
        const enabled = Boolean(playlistProviders[id]);
        return (
            <button
                key={id}
                type="button"
                onPointerDown={event => event.stopPropagation()}
                onClick={event => {
                    event.stopPropagation();
                    handleToggle(id);
                }}
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 min-h-7 px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-all ${peerPillClass(enabled, isDaylight)}`}
                aria-pressed={enabled}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {enabled ? <Check size={14} strokeWidth={2.5} className="opacity-80 shrink-0" /> : null}
                <OnlineProviderMark provider={id} size="sm" />
                <span>{resolveLabel(id)}</span>
            </button>
        );
    });

    return (
        <div
            className={layout === 'flush'
                ? 'w-full space-y-2 pointer-events-auto'
                : 'w-full max-w-6xl mx-auto px-4 md:px-6 space-y-2 pointer-events-auto'}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
            <div className={`flex items-center gap-x-1.5 ${layout === 'flush' ? 'flex-nowrap overflow-x-auto' : 'flex-wrap gap-y-1.5'}`}>
                {layout === 'toolbar' ? (
                    <span className={`text-[11px] font-semibold tracking-wide shrink-0 ${labelClass}`}>
                        {t('home.providerFilter')}
                    </span>
                ) : null}
                {renderPills(deskIds)}
                {layout === 'toolbar' ? (
                    <span className={`basis-full text-[11px] leading-4 ${hintClass}`}>
                        {t('home.providerFilterHint')}
                    </span>
                ) : null}
            </div>

            {libraryIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-semibold tracking-wide shrink-0 ${labelClass}`}>
                        {t('home.libraryFilter')}
                    </span>
                    {renderPills(libraryIds)}
                </div>
            ) : null}

            {showModuleFilter ? (
                <div className={`inline-flex flex-wrap items-center gap-0.5 rounded-full p-1 ${shellClass}`}>
                    {modulePills.map(item => {
                        const active = moduleFilter === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onPointerDown={event => event.stopPropagation()}
                                onClick={event => {
                                    event.stopPropagation();
                                    setModuleFilter(item.id);
                                }}
                                className={`min-h-8 px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-colors ${modulePillClass(active, isDaylight)}`}
                                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default OnlineProviderFilterBar;
