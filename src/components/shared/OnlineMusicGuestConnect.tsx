import React from 'react';
import { CheckCircle2, Loader2, QrCode, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useNeteaseQrLogin } from '../../hooks/useNeteaseQrLogin';
import { useQQMusicLogin } from '../../hooks/useQQMusicLogin';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { hasNeteaseSession, hasQQMusicSession } from '../../utils/onlineLibraryAccess';

// src/components/shared/OnlineMusicGuestConnect.tsx
// Inline provider cards for Netease and QQ Music login.

type OnlineMusicGuestConnectProps = {
    onRefreshUser: () => void;
    user: { userId?: number } | null;
};

const actionButtonClass = 'px-5 py-2.5 bg-white text-black rounded-full font-bold text-xs shadow-sm hover:scale-105 hover:shadow-md transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-sm';

const OnlineMusicGuestConnect: React.FC<OnlineMusicGuestConnectProps> = ({
    onRefreshUser,
    user,
}) => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const netease = useNeteaseQrLogin(onRefreshUser);
    const qq = useQQMusicLogin();
    const qqReady = hasQQMusicSession();
    const neteaseReady = hasNeteaseSession(user);

    const cardClass = isDaylight
        ? 'bg-white/82 border-black/10 shadow-[0_10px_40px_rgba(15,23,42,0.08)]'
        : 'bg-white/16 border-white/25 shadow-[0_10px_40px_rgba(0,0,0,0.22)]';
    const neteaseCardClass = qqReady && !netease.active
        ? (isDaylight ? `${cardClass} ring-1 ring-black/12` : `${cardClass} ring-1 ring-white/35`)
        : cardClass;
    const activeRingClass = isDaylight ? 'ring-1 ring-black/10' : 'ring-1 ring-white/30';
    const titleClass = isDaylight ? 'text-black/90' : 'text-white';
    const promptClass = isDaylight ? 'text-black/58' : 'text-white/78';
    const labelClass = isDaylight ? 'text-black/88' : 'text-white';
    const hintClass = isDaylight ? 'text-black/50' : 'text-white/68';
    const qrMetaClass = isDaylight ? 'text-black/62' : 'text-white/78';
    const qrNoteClass = isDaylight ? 'text-black/45' : 'text-white/62';
    const dividerClass = isDaylight ? 'border-black/8' : 'border-white/18';
    const connectedBadgeClass = isDaylight
        ? 'bg-emerald-500/12 text-emerald-700 border-emerald-500/25'
        : 'bg-emerald-400/18 text-emerald-100 border-emerald-300/35';
    const connectedTextClass = isDaylight ? 'text-emerald-700' : 'text-emerald-100';

    const guestTitle = neteaseReady || qqReady
        ? t('home.guestTitleReady')
        : t('home.guestTitle');
    const guestPrompt = neteaseReady && qqReady
        ? t('home.guestPromptBothReady')
        : qqReady
            ? t('home.guestPromptQQReady')
            : t('home.guestPrompt');

    return (
        <div className="flex flex-1 w-full flex-col items-center justify-center space-y-5 px-4">
            <div className="text-center space-y-2 max-w-md">
                <h2 className={`text-2xl font-bold ${titleClass}`}>{guestTitle}</h2>
                <p className={`text-sm leading-6 whitespace-pre-line ${promptClass}`}>{guestPrompt}</p>
            </div>

            <div
                className="w-full max-w-sm space-y-3 relative z-20 pointer-events-auto"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <div
                    className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-all ${neteaseCardClass} ${netease.active ? activeRingClass : ''}`}
                >
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className={`text-sm font-bold ${labelClass}`}>{t('home.neteaseProvider')}</div>
                            <div className={`text-[11px] mt-0.5 ${hintClass}`}>{t('home.neteaseProviderHint')}</div>
                        </div>
                        {!netease.active && (
                            <button type="button" onClick={() => void netease.start()} className={actionButtonClass}>
                                {t('home.connectAccount')}
                            </button>
                        )}
                    </div>

                    <AnimatePresence initial={false}>
                        {netease.active && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className={`px-4 pb-4 pt-0 border-t ${dividerClass} text-center space-y-3`}>
                                    <div className="flex items-center justify-between pt-3">
                                        <span className={`text-xs font-medium ${qrMetaClass}`}>{t('home.loginTitle')}</span>
                                        <button
                                            type="button"
                                            onClick={netease.cancel}
                                            className={`p-1 rounded-full transition-opacity ${isDaylight ? 'text-black/45 hover:text-black/80' : 'text-white/55 hover:text-white/90'}`}
                                            aria-label={t('status.cancel')}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="inline-block bg-white p-2.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                                        {netease.qrCodeImg ? (
                                            <img src={netease.qrCodeImg} alt="Netease QR" className="w-36 h-36" />
                                        ) : (
                                            <div className="w-36 h-36 flex items-center justify-center bg-gray-50 rounded-lg">
                                                <Loader2 className="animate-spin text-gray-400" size={22} />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-xs font-medium ${netease.isSuccess ? 'text-emerald-500' : qrMetaClass}`}>
                                        {netease.status}
                                    </p>
                                    <p className={`text-[11px] ${qrNoteClass}`}>{t('home.loginNote')}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {qqReady ? (
                    <div className={`rounded-xl border backdrop-blur-xl px-3 py-2.5 flex items-center justify-between gap-3 ${isDaylight ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-400/10 border-emerald-300/25'}`}>
                        <div className={`flex items-center gap-2 text-xs font-medium min-w-0 ${connectedTextClass}`}>
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span className="truncate">{t('home.qqMusicProvider')}</span>
                            <span className="opacity-60">·</span>
                            <span className="shrink-0">{t('home.qqMusicConnected')}</span>
                        </div>
                        {!neteaseReady && (
                            <button
                                type="button"
                                onClick={() => void netease.start()}
                                className={`${actionButtonClass} !px-4 !py-2 text-[11px]`}
                            >
                                {t('home.connectAccount')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`rounded-2xl border backdrop-blur-xl p-4 transition-opacity ${cardClass} ${netease.active ? 'opacity-55 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className={`text-sm font-bold ${labelClass}`}>{t('home.qqMusicProvider')}</div>
                                <div className={`text-[11px] mt-0.5 ${hintClass}`}>{t('home.qqMusicProviderHint')}</div>
                                {qq.flowMessage && (
                                    <div className={`text-[11px] mt-1 ${qq.flowStatus === 'failed' || qq.flowStatus === 'cancelled' ? 'text-red-400' : connectedTextClass}`}>
                                        {qq.flowMessage}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => void qq.openLogin()}
                                disabled={qq.isBusy || !qq.canOpenOfficialLogin}
                                className={`${actionButtonClass} flex items-center gap-1.5`}
                            >
                                {qq.isBusy ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                                {t('home.qqMusicScanLogin')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineMusicGuestConnect;
