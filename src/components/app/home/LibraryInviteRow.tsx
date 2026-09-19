import React from 'react';
import { FolderSync, Loader2, QrCode, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useNeteaseQrLogin } from '../../../hooks/useNeteaseQrLogin';
import { useQQMusicLogin } from '../../../hooks/useQQMusicLogin';
import { useQishuiLogin } from '../../../hooks/useQishuiLogin';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { hasQQMusicSession, hasQishuiSession } from '../../../utils/onlineLibraryAccess';
import { OnlineProviderMark } from '../../shared/OnlineProviderMark';

// src/components/app/home/LibraryInviteRow.tsx
// Quiet login row under the cover field — not a third twin card.

type LibraryInviteRowProps = {
    onRefreshUser: () => void;
};

const actionButtonClass = 'px-4 py-1.5 bg-white text-black rounded-full font-bold text-[11px] shadow-sm hover:scale-105 hover:shadow-md transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-sm';

const LibraryInviteRow: React.FC<LibraryInviteRowProps> = ({ onRefreshUser }) => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const netease = useNeteaseQrLogin(onRefreshUser);
    const qq = useQQMusicLogin();
    const qishui = useQishuiLogin();
    const qqReady = hasQQMusicSession();
    const qishuiReady = hasQishuiSession();
    const promptClass = isDaylight ? 'text-black/58' : 'text-white/78';
    const hintClass = isDaylight ? 'text-black/45' : 'text-white/55';
    const qrMetaClass = isDaylight ? 'text-black/62' : 'text-white/78';
    const connectedTextClass = isDaylight ? 'text-emerald-700' : 'text-emerald-100';
    const panelClass = isDaylight
        ? 'bg-white/82 border-black/10'
        : 'bg-white/16 border-white/25';

    return (
        <div data-app-ui-surface="home-library-invite">
            <div
                className="flex min-w-0 flex-wrap items-center gap-2"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <FolderSync size={14} className={`shrink-0 ${hintClass}`} aria-hidden="true" />
                <p className={`min-w-0 flex-1 truncate text-[12px] ${promptClass}`}>
                    {t('home.libraryInviteBody')}
                </p>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                    {!netease.active ? (
                        <button type="button" onClick={() => void netease.start()} className={actionButtonClass}>
                            {t('home.connectAccount')}
                        </button>
                    ) : null}
                    {qqReady ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${connectedTextClass}`}>
                            <OnlineProviderMark provider="qq" size="sm" />
                            {t('home.qqMusicConnected')}
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void qq.openLogin()}
                            disabled={qq.isBusy}
                            className={`${actionButtonClass} flex items-center gap-1.5`}
                        >
                            {qq.isBusy ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                            {t('home.qqMusicScanLogin')}
                        </button>
                    )}
                    {qishuiReady ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${connectedTextClass}`}>
                            <OnlineProviderMark provider="qishui" size="sm" />
                            {t('home.qishuiConnected')}
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void qishui.openLogin()}
                            disabled={qishui.isBusy}
                            title={!qishui.canOpenOfficialLogin ? t('options.qishuiOfficialLoginDesktopOnly') : undefined}
                            className={`${actionButtonClass} flex items-center gap-1.5`}
                        >
                            {qishui.isBusy ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                            {t('home.qishuiScanLogin')}
                        </button>
                    )}
                </div>
            </div>
            {qishui.flowMessage ? (
                <p className={`mt-1.5 text-[11px] ${qishui.flowStatus === 'failed' || qishui.flowStatus === 'cancelled' || qishui.flowStatus === 'unavailable' ? 'text-red-400' : connectedTextClass}`}>
                    {qishui.flowMessage}
                </p>
            ) : null}
            <AnimatePresence initial={false}>
                {netease.active ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={`mt-3 rounded-2xl border px-4 py-4 text-center space-y-3 ${panelClass}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${qrMetaClass}`}>{t('home.loginTitle')}</span>
                                <button
                                    type="button"
                                    onClick={netease.cancel}
                                    className={`rounded-full p-1 ${isDaylight ? 'text-black/45 hover:text-black/80' : 'text-white/55 hover:text-white/90'}`}
                                    aria-label={t('status.cancel')}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="inline-block rounded-xl bg-white p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                                {netease.qrCodeImg ? (
                                    <img src={netease.qrCodeImg} alt="Netease QR" className="h-36 w-36" />
                                ) : (
                                    <div className="flex h-36 w-36 items-center justify-center rounded-lg bg-gray-50">
                                        <Loader2 className="animate-spin text-gray-400" size={22} />
                                    </div>
                                )}
                            </div>
                            <p className={`text-xs font-medium ${netease.isSuccess ? 'text-emerald-500' : qrMetaClass}`}>
                                {netease.status}
                            </p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default LibraryInviteRow;
