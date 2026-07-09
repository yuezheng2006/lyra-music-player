import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, QrCode, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    ONLINE_LIBRARY_PROVIDER_IDS,
    useOnlineLibraryFilterStore,
    type OnlineLibraryModuleFilter,
    type OnlineLibraryProviderId,
} from '../../stores/useOnlineLibraryFilterStore';
import { useNeteaseQrLogin } from '../../hooks/useNeteaseQrLogin';
import { useQQMusicLogin } from '../../hooks/useQQMusicLogin';

// src/components/shared/OnlineProviderFilterBar.tsx
// Peer library sources only: Netease / QQ / Coco. Qishui is link-parse via search box.

type OnlineProviderFilterBarProps = {
    neteaseConnected: boolean;
    qqConnected: boolean;
    onRefreshUser: () => void;
};

type ConnectTarget = 'netease' | 'qq' | null;

const peerPillClass = (
    enabled: boolean,
    isDaylight: boolean,
    connected: boolean,
) => {
    if (!connected) {
        return isDaylight
            ? 'border border-dashed border-black/20 text-black/55 hover:text-black/80 hover:border-black/35 bg-white/30'
            : 'border border-dashed border-white/35 text-white/82 hover:text-white hover:border-white/55 bg-white/[0.08]';
    }

    if (enabled) {
        return isDaylight
            ? 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/10'
            : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/40';
    }

    // Unselected still keeps a solid hit target so clicks are not "text-only".
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
    onRefreshUser,
}) => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const {
        playlistProviders,
        moduleFilter,
        togglePlaylistProvider,
        setModuleFilter,
        setPlaylistProviderEnabled,
        setSearchProvider,
    } = useOnlineLibraryFilterStore();
    const [connectTarget, setConnectTarget] = useState<ConnectTarget>(null);
    const netease = useNeteaseQrLogin(() => {
        setPlaylistProviderEnabled('netease', true);
        setSearchProvider('netease');
        setConnectTarget(null);
        onRefreshUser();
    });
    const qq = useQQMusicLogin();

    const providerLabels: Record<OnlineLibraryProviderId, string> = {
        netease: t('home.neteaseProvider'),
        qq: t('home.qqMusicProvider'),
        coco: t('home.cocoProvider'),
    };

    const providerHints: Partial<Record<OnlineLibraryProviderId, string>> = {
        coco: t('home.cocoProviderHint'),
    };

    const isConnected = (id: OnlineLibraryProviderId) => {
        if (id === 'netease') return neteaseConnected;
        if (id === 'qq') return qqConnected;
        return true;
    };

    const modulePills: Array<{ id: OnlineLibraryModuleFilter; label: string }> = [
        { id: 'all', label: t('home.moduleAll') },
        { id: 'created', label: t('home.moduleCreated') },
        { id: 'liked', label: t('home.moduleLiked') },
    ];

    // Coco has no personal library, so created/liked modules are meaningless when it is the only source.
    const showModuleFilter = useMemo(() => {
        const enabledConnected = ONLINE_LIBRARY_PROVIDER_IDS.filter((id) => {
            if (!playlistProviders[id]) return false;
            return isConnected(id);
        });
        return enabledConnected.some(id => id === 'netease' || id === 'qq');
    }, [playlistProviders, neteaseConnected, qqConnected]);

    useEffect(() => {
        if (!showModuleFilter && moduleFilter !== 'all') {
            setModuleFilter('all');
        }
    }, [moduleFilter, setModuleFilter, showModuleFilter]);

    const shellClass = isDaylight ? 'bg-black/5' : 'bg-white/[0.08]';
    const panelClass = isDaylight
        ? 'bg-white/90 border-black/10 text-black'
        : 'bg-black/70 border-white/15 text-white';
    const mutedClass = isDaylight ? 'text-black/55' : 'text-white/72';
    const labelClass = isDaylight ? 'text-black/45' : 'text-white/58';
    const actionButtonClass = 'px-4 py-2 bg-white text-black rounded-full font-bold text-xs shadow-sm hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100';

    const handleProviderClick = (id: OnlineLibraryProviderId) => {
        const connected = isConnected(id);
        if (!connected) {
            if (id === 'netease' || id === 'qq') {
                setConnectTarget(id);
                if (id === 'netease') {
                    void netease.start();
                }
            }
            return;
        }

        // One click = toggle source visibility. Enabling also becomes the search channel.
        // Previous two-step "focus then toggle" looked like a dead click.
        togglePlaylistProvider(id);
    };

    const closeConnect = () => {
        netease.cancel();
        setConnectTarget(null);
    };

    return (
        <div
            className="w-full max-w-6xl mx-auto px-4 md:px-6 space-y-3 pointer-events-auto"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
            <div className="flex flex-wrap items-center gap-2.5">
                <span className={`text-xs font-semibold uppercase tracking-wide shrink-0 ${labelClass}`}>
                    {t('home.providerFilter')}
                </span>
                {ONLINE_LIBRARY_PROVIDER_IDS.map(id => {
                    const connected = isConnected(id);
                    const enabled = connected && playlistProviders[id];
                    return (
                        <button
                            key={id}
                            type="button"
                            onPointerDown={(event) => {
                                // Avoid Electron drag-region swallowing the first click.
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.stopPropagation();
                                handleProviderClick(id);
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 rounded-full text-sm font-medium cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-all ${peerPillClass(enabled, isDaylight, connected)}`}
                            title={providerHints[id] || (connected ? undefined : t('home.connectProvider'))}
                            aria-pressed={enabled}
                            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                        >
                            {!connected && <Plus size={14} className="opacity-70 shrink-0" />}
                            {connected && enabled && (
                                <Check size={14} strokeWidth={2.5} className="opacity-80 shrink-0" />
                            )}
                            <span>{providerLabels[id]}</span>
                            {!connected && (
                                <span className="opacity-70">{t('home.connectShort')}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {showModuleFilter && (
                <div className={`inline-flex flex-wrap items-center gap-1 rounded-full p-1.5 ${shellClass}`}>
                    {modulePills.map(item => {
                        const active = moduleFilter === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setModuleFilter(item.id);
                                }}
                                className={`min-h-10 px-4 py-2 rounded-full text-sm font-medium cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-colors ${modulePillClass(active, isDaylight)}`}
                                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {connectTarget && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`rounded-2xl border backdrop-blur-xl p-4 ${panelClass}`}
                        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <div className="text-sm font-bold">
                                    {connectTarget === 'netease'
                                        ? t('home.neteaseProvider')
                                        : t('home.qqMusicProvider')}
                                </div>
                                <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                    {connectTarget === 'netease'
                                        ? t('home.neteaseProviderHint')
                                        : t('home.qqMusicProviderHint')}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeConnect}
                                className={`p-1.5 rounded-full ${mutedClass}`}
                                aria-label={t('status.cancel')}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {connectTarget === 'netease' ? (
                            <div className="text-center space-y-3">
                                <div className="inline-block bg-white p-2.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                                    {netease.qrCodeImg ? (
                                        <img src={netease.qrCodeImg} alt="Netease QR" className="w-36 h-36" />
                                    ) : (
                                        <div className="w-36 h-36 flex items-center justify-center bg-gray-50 rounded-lg">
                                            <Loader2 className="animate-spin text-gray-400" size={22} />
                                        </div>
                                    )}
                                </div>
                                <p className={`text-xs font-medium ${netease.isSuccess ? 'text-emerald-500' : mutedClass}`}>
                                    {netease.status || t('home.loadingQr')}
                                </p>
                                <p className={`text-[11px] ${mutedClass}`}>{t('home.loginNote')}</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <div className={`text-xs ${mutedClass}`}>
                                    {qq.flowMessage || t('home.qqMusicProviderHint')}
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const ok = await qq.openLogin();
                                        if (ok) {
                                            setPlaylistProviderEnabled('qq', true);
                                            setSearchProvider('qq');
                                            setConnectTarget(null);
                                        }
                                    }}
                                    disabled={qq.isBusy || !qq.canOpenOfficialLogin}
                                    className={`${actionButtonClass} flex items-center gap-1.5`}
                                >
                                    {qq.isBusy ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                                    {t('home.qqMusicScanLogin')}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnlineProviderFilterBar;
