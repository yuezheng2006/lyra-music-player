import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { NeteaseUser, OnlineMusicProviderId } from '../../types';
import { useOnlineLibraryFilterStore } from '../../stores/useOnlineLibraryFilterStore';
import {
    DEFAULT_UNIFIED_ACCOUNT_PROVIDER_ID,
    UNIFIED_ACCOUNT_PROVIDERS,
} from '../../utils/musicAccounts/unifiedMusicAccountProviders';
import { hasNeteaseSession, hasQQMusicSession, hasQishuiSession, hasKugouSession } from '../../utils/onlineLibraryAccess';
import NeteaseAccountCard from './NeteaseAccountCard';
import QQMusicAccountCard from './QQMusicAccountCard';
import QishuiAccountCard from './QishuiAccountCard';
import KugouAccountCard from './KugouAccountCard';
import PeerFreeAccountDetail from './PeerFreeAccountDetail';

// src/components/panelTab/UnifiedMusicAccountsPanel.tsx
// List + detail account connect UI (Mineradio-inspired, without drag wiring).

type UnifiedMusicAccountsPanelProps = {
    user: NeteaseUser | null;
    onLogout: () => void;
    onSyncData: () => void;
    isSyncing: boolean;
    onRefreshUser: () => void;
    onOpenQQMusicSettings?: () => void;
};

const UnifiedMusicAccountsPanel: React.FC<UnifiedMusicAccountsPanelProps> = ({
    user,
    onLogout,
    onSyncData,
    isSyncing,
    onRefreshUser,
    onOpenQQMusicSettings,
}) => {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<OnlineMusicProviderId>(DEFAULT_UNIFIED_ACCOUNT_PROVIDER_ID);
    const { playlistProviders, setPlaylistProviderEnabled } = useOnlineLibraryFilterStore(useShallow((s) => ({
        playlistProviders: s.playlistProviders,
        setPlaylistProviderEnabled: s.setPlaylistProviderEnabled,
    })));

    const selected = useMemo(
        () => UNIFIED_ACCOUNT_PROVIDERS.find((item) => item.id === selectedId) || UNIFIED_ACCOUNT_PROVIDERS[0],
        [selectedId],
    );

    const qqReady = hasQQMusicSession();
    const neteaseReady = hasNeteaseSession(user);
    const qishuiReady = hasQishuiSession();
    const kugouReady = hasKugouSession();

    const statusLabel = (id: OnlineMusicProviderId) => {
        if (id === 'netease') {
            return neteaseReady
                ? (t('account.connected') || '已接入')
                : (t('account.neteaseAnonymous') || '需要登录');
        }
        if (id === 'qq') {
            return qqReady
                ? (t('account.connected') || '已接入')
                : (t('account.qqMusicAnonymous') || '需要登录');
        }
        if (id === 'qishui') {
            return qishuiReady
                ? (t('account.connected') || '已接入')
                : (t('account.qishuiAnonymous') || '需要登录');
        }
        if (id === 'kugou') {
            return kugouReady
                ? (t('account.connected') || '已接入')
                : (t('account.kugouAnonymous') || '需要登录');
        }
        return t('account.peerFreeAvailable') || '无需登录';
    };

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">
            <div className="px-1 space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-45">
                    {t('account.connectTitle') || t('account.musicAccounts') || '账号接入'}
                </div>
                <p className="text-[10px] leading-relaxed opacity-40">
                    {t('account.connectHint') || '选择平台完成登录；「展示」控制是否出现在首页源列表。'}
                </p>
            </div>

            <div className="space-y-1.5 overflow-y-auto pr-0.5 shrink-0 max-h-[42%]">
                {UNIFIED_ACCOUNT_PROVIDERS.map((provider) => {
                    const visible = playlistProviders[provider.id] !== false;
                    const active = selectedId === provider.id;
                    return (
                        <div
                            key={provider.id}
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                                active ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent hover:bg-white/[0.07]'
                            }`}
                        >
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                                onClick={() => setSelectedId(provider.id)}
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold tracking-wide">
                                    {provider.badge}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-bold">
                                        {t(provider.titleKey)}
                                    </span>
                                    <span className="block truncate text-[10px] opacity-50">
                                        {statusLabel(provider.id)}
                                    </span>
                                </span>
                            </button>
                            <label
                                className="flex shrink-0 items-center gap-1.5 text-[10px] opacity-70"
                                title={t('account.showInHome') || '展示到首页源列表'}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <span>{t('account.showToggle') || '展示'}</span>
                                <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 accent-emerald-400"
                                    checked={visible}
                                    onChange={(event) => {
                                        setPlaylistProviderEnabled(provider.id, event.target.checked);
                                    }}
                                />
                            </label>
                        </div>
                    );
                })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-40 px-1 mb-2">
                    {t('account.connectDetail') || '接入详情'}
                </div>
                {selected.id === 'netease' ? (
                    <NeteaseAccountCard
                        user={user}
                        onLogout={onLogout}
                        onSyncData={onSyncData}
                        isSyncing={isSyncing}
                        onRefreshUser={onRefreshUser}
                    />
                ) : selected.id === 'qq' ? (
                    <QQMusicAccountCard onOpenSettings={onOpenQQMusicSettings} />
                ) : selected.id === 'qishui' ? (
                    <QishuiAccountCard />
                ) : selected.id === 'kugou' ? (
                    <KugouAccountCard />
                ) : (
                    <PeerFreeAccountDetail
                        providerId={selected.id}
                        title={t(selected.titleKey)}
                        hint={t(selected.hintKey)}
                    />
                )}
            </div>
        </div>
    );
};

export default UnifiedMusicAccountsPanel;
