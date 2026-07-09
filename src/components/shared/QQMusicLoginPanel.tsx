import React, { useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Loader2, LogOut, Music2, QrCode, Trash2, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQQMusicLogin } from '../../hooks/useQQMusicLogin';
import {
    getStoredQQMusicCookie,
    parseQQMusicUin,
    getQQMusicKeyFromCookie,
    setStoredQQMusicCookie,
    clearStoredQQMusicCookie,
} from '../../services/musicProviders/qqMusicAuth';

// src/components/shared/QQMusicLoginPanel.tsx
// Compact QQ Music login UI reused in settings, account panel, and guest connect flows.

type QQMusicLoginPanelProps = {
    variant?: 'settings' | 'account' | 'guest-button';
    cardClass?: string;
    successBgColor?: string;
    successTextColor?: string;
    errorBgColor?: string;
    errorTextColor?: string;
    onNeedSettings?: () => void;
};

const QQMusicLoginPanel: React.FC<QQMusicLoginPanelProps> = ({
    variant = 'settings',
    cardClass = 'p-4 rounded-xl border border-white/10 bg-white/[0.03]',
    successBgColor = 'bg-emerald-500/15',
    successTextColor = 'text-emerald-300',
    errorBgColor = 'bg-red-500/10',
    errorTextColor = 'text-red-300',
    onNeedSettings,
}) => {
    const { t } = useTranslation();
    const {
        auth,
        canOpenOfficialLogin,
        flowMessage,
        flowStatus,
        isBusy,
        logout,
        openLogin,
        statusText,
    } = useQQMusicLogin();
    const [cookieDraft, setCookieDraft] = useState(() => getStoredQQMusicCookie());
    const [manualOpen, setManualOpen] = useState(false);
    const [saveHint, setSaveHint] = useState<'idle' | 'saved'>('idle');

    const handlePrimaryAction = async () => {
        if (canOpenOfficialLogin) {
            await openLogin();
            return;
        }
        onNeedSettings?.();
    };

    const handleSaveCookie = () => {
        setStoredQQMusicCookie(cookieDraft);
        setCookieDraft(getStoredQQMusicCookie());
        setSaveHint('saved');
        window.setTimeout(() => setSaveHint('idle'), 1600);
    };

    const handleClearCookie = () => {
        logout();
        setCookieDraft('');
    };

    const primaryLabel = auth.isLoggedIn
        ? (t('account.qqMusicUpdateLogin') || 'Refresh login')
        : (t('account.qqMusicScanLogin') || 'Scan to log in');

    const loginReady = auth.isLoggedIn;
    const cookieValid = parseQQMusicUin(cookieDraft) !== '0' && getQQMusicKeyFromCookie(cookieDraft).length > 0;

    if (variant === 'guest-button') {
        return (
            <button
                type="button"
                onClick={() => void handlePrimaryAction()}
                disabled={isBusy}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                {loginReady ? (t('home.qqMusicConnected') || 'QQ Music connected') : (t('home.qqMusicScanLogin') || 'QQ Music scan login')}
            </button>
        );
    }

    if (variant === 'account') {
        const statusIcon = auth.isLoggedIn
            ? <CheckCircle2 size={14} className="text-emerald-300" />
            : auth.hasCookie
                ? <TriangleAlert size={14} className="text-amber-300" />
                : <QrCode size={14} className="opacity-70" />;

        return (
            <div className="bg-white/5 p-3 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            {statusIcon}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                                <Music2 size={13} />
                                <span className="truncate">{t('account.qqMusic') || 'QQ Music'}</span>
                            </div>
                            <div className="text-[10px] opacity-55 truncate">{statusText}</div>
                        </div>
                    </div>
                    {auth.playbackKeyReady && <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void handlePrimaryAction()}
                        disabled={isBusy}
                        className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBusy ? <Loader2 size={13} className="animate-spin" /> : <QrCode size={13} />}
                        {primaryLabel}
                    </button>
                    {auth.hasCookie && (
                        <button
                            type="button"
                            onClick={logout}
                            className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors"
                            title={t('account.qqMusicLogout') || 'Log out QQ Music'}
                            aria-label={t('account.qqMusicLogout') || 'Log out QQ Music'}
                        >
                            <LogOut size={13} />
                            {t('account.qqMusicLogoutShort') || 'Log out'}
                        </button>
                    )}
                </div>
                {flowMessage && (
                    <div className={`text-[10px] ${flowStatus === 'failed' || flowStatus === 'cancelled' ? errorTextColor : successTextColor}`}>
                        {flowMessage}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${loginReady ? successBgColor : 'bg-white/10'}`}>
                        {loginReady ? <Check size={18} className={successTextColor} /> : <QrCode size={18} />}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {loginReady
                                ? (t('options.qqMusicAccountReady') || 'QQ Music account connected')
                                : (t('options.qqMusicOfficialLogin') || 'Scan QR code to log in')}
                        </div>
                        <div className="text-[10px] opacity-55 truncate" style={{ color: 'var(--text-secondary)' }}>
                            {statusText}
                        </div>
                        <div className="text-[10px] opacity-35 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {t('options.qqMusicCoexistHint') || 'Can coexist with Netease. QQ search and playback use this login only.'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => void handlePrimaryAction()}
                        disabled={!canOpenOfficialLogin || isBusy}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                        {primaryLabel}
                    </button>
                    {loginReady && (
                        <button
                            type="button"
                            onClick={logout}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${errorBgColor} hover:bg-red-500/20 ${errorTextColor}`}
                            aria-label={t('options.qqMusicLogout') || 'Log out QQ Music'}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {!canOpenOfficialLogin && (
                <>
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-[10px] opacity-55" style={{ color: 'var(--text-secondary)' }}>
                        {t('options.qqMusicOfficialLoginDesktopOnly') || 'Official QR login is available in the desktop app. Browser mode can only use manual Cookie fallback.'}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => setManualOpen(open => !open)}
                            className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <span className="text-xs font-medium">{t('options.qqMusicManualCookie') || 'Manual Cookie fallback'}</span>
                            <ChevronDown size={15} className={`shrink-0 transition-transform ${manualOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {manualOpen && (
                            <div className="px-3 pb-3 space-y-2">
                                <textarea
                                    value={cookieDraft}
                                    onChange={(event) => {
                                        setCookieDraft(event.target.value);
                                        setSaveHint('idle');
                                    }}
                                    placeholder={t('options.qqMusicCookiePlaceholder') || 'uin=o123456789; qm_keyst=...; qqmusic_key=...'}
                                    rows={3}
                                    spellCheck={false}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:border-white/30 transition-colors resize-y"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                <div className="flex items-center justify-end gap-2">
                                    {saveHint === 'saved' && (
                                        <span className={`text-[10px] ${successTextColor}`}>{t('options.qqMusicCookieSaved') || 'Saved'}</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSaveCookie}
                                        disabled={!cookieValid}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 disabled:opacity-40"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {t('options.save') || 'Save'}
                                    </button>
                                    {cookieDraft.trim() && (
                                        <button
                                            type="button"
                                            onClick={handleClearCookie}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${errorBgColor} hover:bg-red-500/20 ${errorTextColor}`}
                                        >
                                            {t('options.qqMusicCookieClear') || 'Clear'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {flowMessage && (
                <div className={`flex items-center gap-2 text-[10px] ${flowStatus === 'failed' || flowStatus === 'cancelled' ? errorTextColor : successTextColor}`}>
                    {isBusy
                        ? <Loader2 size={13} className="animate-spin" />
                        : flowStatus === 'failed' || flowStatus === 'cancelled'
                            ? <AlertCircle size={13} />
                            : <Check size={13} />}
                    <span>{flowMessage}</span>
                </div>
            )}
        </div>
    );
};

export default QQMusicLoginPanel;
