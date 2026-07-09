import React from 'react';
import {
    CheckCircle2,
    Crown,
    Loader2,
    LogOut,
    QrCode,
    RefreshCw,
    X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NeteaseUser } from '../../types';
import { useNeteaseQrLogin } from '../../hooks/useNeteaseQrLogin';

// src/components/panelTab/NeteaseAccountCard.tsx
// Netease account card with QR login, sync, and logout.

type NeteaseAccountCardProps = {
    user: NeteaseUser | null;
    onLogout: () => void;
    onSyncData: () => void;
    isSyncing: boolean;
    onRefreshUser: () => void;
};

const NeteaseAccountCard: React.FC<NeteaseAccountCardProps> = ({
    user,
    onLogout,
    onSyncData,
    isSyncing,
    onRefreshUser,
}) => {
    const { t } = useTranslation();
    const netease = useNeteaseQrLogin(onRefreshUser);
    const isVip = Boolean(user?.vipType && user.vipType !== 0);

    if (user) {
        return (
            <div className="bg-white/5 p-3 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/10 shrink-0">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl.replace('http:', 'https:')}
                                    className="w-full h-full object-cover"
                                    alt={user.nickname}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <CheckCircle2 size={14} className="text-emerald-300" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                                <span className="truncate">{t('account.netease') || 'Netease Cloud Music'}</span>
                                {isVip && <Crown size={12} className="text-white fill-white shrink-0" />}
                            </div>
                            <div className="text-[10px] opacity-55 truncate">
                                {user.nickname}
                                <span className="opacity-60"> · ID {user.userId}</span>
                            </div>
                        </div>
                    </div>
                    <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onSyncData}
                        disabled={isSyncing}
                        className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing
                            ? t('account.syncing')
                            : (t('account.syncNeteaseData') || t('account.syncData'))}
                    </button>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors"
                        title={t('account.logout')}
                        aria-label={t('account.logout')}
                    >
                        <LogOut size={13} />
                        {t('account.qqMusicLogoutShort') || t('account.logout')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 p-3 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <QrCode size={14} className="opacity-70" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                            {t('account.netease') || 'Netease Cloud Music'}
                        </div>
                        <div className="text-[10px] opacity-55 truncate">
                            {netease.active
                                ? (netease.status || t('home.scanQr'))
                                : (t('account.neteaseAnonymous') || 'Login required')}
                        </div>
                    </div>
                </div>
            </div>

            {netease.active ? (
                <div className="space-y-2">
                    <div className="relative mx-auto w-fit rounded-xl overflow-hidden bg-white p-2">
                        {netease.qrCodeImg ? (
                            <img src={netease.qrCodeImg} alt="Netease QR" className="w-36 h-36" />
                        ) : (
                            <div className="w-36 h-36 flex items-center justify-center text-black/40">
                                <Loader2 size={20} className="animate-spin" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={netease.cancel}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                            aria-label={t('ui.cancel') || 'Cancel'}
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="text-[10px] text-center opacity-55">
                        {netease.isSuccess
                            ? (t('home.loginSuccess') || 'Login success')
                            : (netease.status || t('home.scanQr'))}
                    </div>
                    {(netease.status === t('home.qrExpired') || netease.status === t('home.loginError')) && (
                        <button
                            type="button"
                            onClick={() => void netease.start()}
                            className="w-full h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-[11px] font-bold transition-colors"
                        >
                            <RefreshCw size={13} />
                            {t('account.neteaseRetryQr') || 'Refresh QR'}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => void netease.start()}
                    className="w-full h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-[11px] font-bold transition-colors"
                >
                    <QrCode size={13} />
                    {t('account.neteaseScanLogin') || 'Scan to log in'}
                </button>
            )}
        </div>
    );
};

export default NeteaseAccountCard;
