import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AudioLines,
    ChevronLeft,
    ChevronRight,
    Home as HomeIcon,
    Podcast,
    Settings,
    Sparkles,
} from 'lucide-react';

// src/components/app/chrome/AppSidebar.tsx
// Expanded: full Qishui rail. Collapsed: zero-width, only a translucent expand toggle.

export type AppSidebarActive = 'home' | 'daily' | 'podcast' | 'listening';

type AppSidebarProps = {
    active: AppSidebarActive;
    isDaylight: boolean;
    hasCurrentSong: boolean;
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onOpenHome: () => void;
    onOpenDaily: () => void;
    onOpenPodcast: () => void;
    onOpenListeningMode: () => void;
    onOpenSettings?: () => void;
};

const navButtonClass = (active: boolean, isDaylight: boolean) => {
    if (active) {
        return `gap-3 px-3 py-2.5 ${isDaylight ? 'bg-black/[0.08] text-black' : 'bg-white/[0.12] text-white'}`;
    }
    return `gap-3 px-3 py-2.5 ${isDaylight
        ? 'text-black/55 hover:bg-black/[0.05] hover:text-black'
        : 'text-white/55 hover:bg-white/[0.08] hover:text-white'}`;
};

const AppSidebar: React.FC<AppSidebarProps> = ({
    active,
    isDaylight,
    hasCurrentSong,
    collapsed,
    onToggleCollapsed,
    onOpenHome,
    onOpenDaily,
    onOpenPodcast,
    onOpenListeningMode,
    onOpenSettings,
}) => {
    const { t } = useTranslation();
    const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);
    const shellClass = isDaylight
        ? 'bg-[#f3f1ec]/92 border-black/8 text-black'
        : 'bg-black/35 border-white/8 text-white';
    const brandMuted = isDaylight ? 'text-black/40' : 'text-white/40';
    const sectionLabel = isDaylight ? 'text-black/35' : 'text-white/35';
    const expandToggleClass = isDaylight
        ? 'bg-white/45 text-black/55 border-black/10 hover:bg-white/70 hover:text-black shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
        : 'bg-black/35 text-white/70 border-white/12 hover:bg-black/55 hover:text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]';

    useEffect(() => {
        if (!window.electron?.getUpdateStatus) {
            return;
        }

        let disposed = false;
        const applyStatus = (status: ElectronUpdateStatus | null) => {
            if (disposed) return;
            setShowUpdateIndicator(Boolean(
                status?.updateCheckEnabled
                && status.availableVersion
                && !status.updateSeen,
            ));
        };

        void window.electron.getUpdateStatus().then(applyStatus).catch(() => applyStatus(null));
        const unsubscribe = window.electron.onUpdateStatusChanged?.(applyStatus);
        return () => {
            disposed = true;
            unsubscribe?.();
        };
    }, []);

    // Fully collapsed: reclaim canvas width; only a translucent expand control remains.
    if (collapsed) {
        return (
            <div
                className="pointer-events-none absolute left-0 top-0 z-[60] h-full w-0"
                style={{
                    WebkitAppRegion: 'no-drag',
                    ['--app-sidebar-width' as string]: '0px',
                } as React.CSSProperties}
                data-collapsed="true"
            >
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    className={`pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 ${expandToggleClass}`}
                    title={t('app.sidebarExpand')}
                    aria-label={t('app.sidebarExpand')}
                >
                    <ChevronRight size={16} strokeWidth={2.25} />
                    {showUpdateIndicator ? (
                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    ) : null}
                </button>
            </div>
        );
    }

    return (
        <aside
            className={`relative z-[50] flex h-full w-[220px] shrink-0 flex-col border-r backdrop-blur-xl transition-[width,opacity] duration-300 ease-out ${shellClass}`}
            style={{
                WebkitAppRegion: 'no-drag',
                ['--app-sidebar-width' as string]: '220px',
            } as React.CSSProperties}
            data-collapsed="false"
        >
            <div className="px-5 pt-10 pb-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-lg font-bold tracking-tight">Lyra</div>
                        <div className={`mt-1 text-[11px] ${brandMuted}`}>
                            {t('app.sidebarTagline')}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isDaylight ? 'hover:bg-black/8 text-black/55' : 'hover:bg-white/10 text-white/55'
                        }`}
                        title={t('app.sidebarCollapse')}
                        aria-label={t('app.sidebarCollapse')}
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>
            </div>

            <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 pb-4">
                <div className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] ${sectionLabel}`}>
                    {t('app.sidebarBrowse')}
                </div>
                <button
                    type="button"
                    onClick={onOpenHome}
                    className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(active === 'home', isDaylight)}`}
                    aria-current={active === 'home' ? 'page' : undefined}
                    title={t('app.sidebarHome')}
                >
                    <HomeIcon size={18} strokeWidth={2} />
                    <span>{t('app.sidebarHome')}</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenDaily}
                    className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(active === 'daily', isDaylight)}`}
                    aria-current={active === 'daily' ? 'page' : undefined}
                    title={t('app.sidebarDaily')}
                >
                    <Sparkles size={18} strokeWidth={2} />
                    <span>{t('app.sidebarDaily')}</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenPodcast}
                    className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(active === 'podcast', isDaylight)}`}
                    aria-current={active === 'podcast' ? 'page' : undefined}
                    title={t('app.sidebarPodcast')}
                >
                    <Podcast size={18} strokeWidth={2} />
                    <span>{t('app.sidebarPodcast')}</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenListeningMode}
                    disabled={!hasCurrentSong}
                    className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors disabled:opacity-35 disabled:hover:bg-transparent ${navButtonClass(active === 'listening', isDaylight)}`}
                    aria-current={active === 'listening' ? 'page' : undefined}
                    title={hasCurrentSong ? t('player.listeningMode') : t('app.sidebarListeningDisabled')}
                >
                    <AudioLines size={18} strokeWidth={2} />
                    <span>{t('player.listeningMode')}</span>
                </button>
            </nav>

            {onOpenSettings ? (
                <div className="px-3 pb-[calc(var(--app-player-bar-height,72px)+16px)]">
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className={`relative flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(false, isDaylight)}`}
                        title={t('app.sidebarSettings')}
                    >
                        <Settings size={18} strokeWidth={2} />
                        <span>{t('app.sidebarSettings')}</span>
                        {showUpdateIndicator ? (
                            <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                isDaylight ? 'bg-black/8 text-black/70' : 'bg-white/12 text-white/80'
                            }`}>
                                {t('app.sidebarUpdateAvailable')}
                            </span>
                        ) : null}
                    </button>
                </div>
            ) : (
                <div className="pb-[calc(var(--app-player-bar-height,72px)+16px)]" />
            )}
        </aside>
    );
};

export default AppSidebar;
