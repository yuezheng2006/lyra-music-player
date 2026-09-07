import React, { useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Loader2, LogOut, QrCode, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQishuiLogin } from '../../hooks/useQishuiLogin';
import {
    getStoredQishuiCookie,
    qishuiCookieHasLogin,
    setStoredQishuiCookie,
} from '../../services/musicProviders/qishuiMusicAuth';
import { OnlineProviderMark } from './OnlineProviderMark';

// src/components/shared/QishuiLoginPanel.tsx
// Compact Qishui login UI reused in settings and the unified account panel.

type QishuiLoginPanelProps = {
    variant?: 'settings' | 'account';
    cardClass?: string;
    successBgColor?: string;
    successTextColor?: string;
    errorBgColor?: string;
    errorTextColor?: string;
};

const QishuiLoginPanel: React.FC<QishuiLoginPanelProps> = ({
    variant = 'settings',
    cardClass = 'p-4 rounded-xl border border-white/10 bg-white/[0.03]',
    successBgColor = 'bg-emerald-500/15',
    successTextColor = 'text-emerald-300',
    errorBgColor = 'bg-red-500/10',
    errorTextColor = 'text-red-300',
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
    } = useQishuiLogin();
    const [cookieDraft, setCookieDraft] = useState(() => getStoredQishuiCookie());
    const [manualOpen, setManualOpen] = useState(false);
    const [saveHint, setSaveHint] = useState<'idle' | 'saved'>('idle');

    const handlePrimaryAction = async () => {
        await openLogin();
    };

    const handleSaveCookie = () => {
        setStoredQishuiCookie(cookieDraft);
        setCookieDraft(getStoredQishuiCookie());
        setSaveHint('saved');
        window.setTimeout(() => setSaveHint('idle'), 1600);
    };

    const handleClearCookie = () => {
        logout();
        setCookieDraft('');
    };

    const primaryLabel = auth.isLoggedIn
        ? (t('account.qishuiUpdateLogin') || 'Refresh login')
        : (t('account.qishuiScanLogin') || 'Scan to log in');
    const cookieValid = qishuiCookieHasLogin(cookieDraft);

    if (variant === 'account') {
        return (
            <div className="bg-white/5 p-3 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <OnlineProviderMark provider="qishui" size="md" />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                                <span className="truncate">{t('home.qishuiProvider') || 'Qishui Music'}</span>
                            </div>
                            <div className="text-[10px] opacity-55 truncate">{statusText}</div>
                        </div>
                    </div>
                    {auth.isLoggedIn && <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />}
                </div>
                <p className="text-[10px] leading-relaxed opacity-45 px-0.5">
                    {t('account.qishuiHint') || 'Official web login attaches the session to search and audition. Playlists are not synced yet.'}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void handlePrimaryAction()}
                        disabled={isBusy}
                        title={!canOpenOfficialLogin ? t('options.qishuiOfficialLoginDesktopOnly') : undefined}
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
                            title={t('account.qishuiLogout') || 'Log out Qishui'}
                            aria-label={t('account.qishuiLogout') || 'Log out Qishui'}
                        >
                            <LogOut size={13} />
                            {t('account.qishuiLogoutShort') || 'Log out'}
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${auth.isLoggedIn ? successBgColor : 'bg-white/10'}`}>
                        {auth.isLoggedIn ? <Check size={18} className={successTextColor} /> : <OnlineProviderMark provider="qishui" size="md" />}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {auth.isLoggedIn
                                ? (t('options.qishuiAccountReady') || 'Qishui account connected')
                                : (t('options.qishuiOfficialLogin') || 'Scan QR code to log in')}
                        </div>
                        <div className="text-[10px] opacity-55 truncate" style={{ color: 'var(--text-secondary)' }}>
                            {statusText}
                        </div>
                        <div className="text-[10px] opacity-35 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {t('options.qishuiCoexistHint') || 'Attaches the official session to Qishui search and audition. Independent from Netease / QQ.'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => void handlePrimaryAction()}
                        disabled={isBusy}
                        title={!canOpenOfficialLogin ? t('options.qishuiOfficialLoginDesktopOnly') : undefined}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                        {primaryLabel}
                    </button>
                    {auth.isLoggedIn && (
                        <button
                            type="button"
                            onClick={logout}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${errorBgColor} hover:bg-red-500/20 ${errorTextColor}`}
                            aria-label={t('options.qishuiLogout') || 'Log out Qishui'}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {!canOpenOfficialLogin && (
                <>
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-[10px] opacity-55" style={{ color: 'var(--text-secondary)' }}>
                        {t('options.qishuiOfficialLoginDesktopOnly') || 'Official QR login is available in the desktop app. Browser mode can only use manual Cookie fallback.'}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => setManualOpen(open => !open)}
                            className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <span className="text-xs font-medium">{t('options.qishuiManualCookie') || 'Manual Cookie fallback'}</span>
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
                                    placeholder={t('options.qishuiCookiePlaceholder') || 'sessionid=...; sid_tt=...'}
                                    rows={3}
                                    spellCheck={false}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:border-white/30 transition-colors resize-y"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                <div className="flex items-center justify-end gap-2">
                                    {saveHint === 'saved' && (
                                        <span className={`text-[10px] ${successTextColor}`}>{t('options.qishuiCookieSaved') || 'Saved'}</span>
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
                                            {t('options.qishuiCookieClear') || 'Clear'}
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

export default QishuiLoginPanel;
