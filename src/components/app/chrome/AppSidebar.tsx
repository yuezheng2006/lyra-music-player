import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Podcast,
    Radio,
    AudioLines,
    Settings,
    Music2,
    ListMusic,
    Clock,
    Search,
    type LucideIcon,
} from 'lucide-react';
import type { Theme } from '../../../types';
import { isNavidromeUiEnabled, isYtmusicUiEnabled } from '../../../utils/featureFlags';
import { resolveSidebarNavGroups, type SidebarNavItemId } from '../../../utils/home/sidebarNavMath';

// src/components/app/chrome/AppSidebar.tsx
// Expanded: full Qishui rail. Collapsed: zero-width, only a translucent expand toggle.
// Daily recommend nav is intentionally omitted (NetEase VIP / 30s trial UX).

export type AppSidebarActive = 'home' | 'charts' | 'podcast' | 'radio' | 'local' | 'navidrome' | 'ytmusic' | 'history';

type AppSidebarProps = {
    active: AppSidebarActive;
    isDaylight: boolean;
    theme?: Theme;
    collapsed: boolean;
    /** Immersive fullscreen: hide the rail entirely without changing collapse preference. */
    forceHidden?: boolean;
    navidromeEnabled?: boolean;
    onToggleCollapsed: () => void;
    hasPersonalLibrary?: boolean;
    onOpenHome?: () => void;
    onOpenCharts?: () => void;
    onOpenPodcast: () => void;
    onOpenRadio?: () => void;
    onOpenLocal: () => void;
    onOpenNavidrome?: () => void;
    onOpenYtmusic?: () => void;
    onOpenHistory?: () => void;
    onOpenSettings?: () => void;
};

const navButtonClass = (active: boolean) => {
    if (active) {
        return 'gap-3 px-3 py-2.5 bg-[var(--shell-hover)] text-[color:var(--shell-text)]';
    }
    return 'gap-3 px-3 py-2.5 text-[color:var(--shell-muted-text)] hover:bg-[var(--shell-hover)] hover:text-[color:var(--shell-text)]';
};

const NAV_ITEM_META: Record<SidebarNavItemId, {
    active: AppSidebarActive;
    icon: LucideIcon;
    labelKey: string;
}> = {
    charts: { active: 'charts', icon: Search, labelKey: 'app.sidebarCharts' },
    library: { active: 'home', icon: ListMusic, labelKey: 'app.sidebarLibrary' },
    radio: { active: 'radio', icon: AudioLines, labelKey: 'app.sidebarFm' },
    podcast: { active: 'podcast', icon: Podcast, labelKey: 'app.sidebarPodcast' },
    history: { active: 'history', icon: Clock, labelKey: 'app.sidebarHistory' },
    local: { active: 'local', icon: FolderOpen, labelKey: 'app.sidebarLocal' },
    navidrome: { active: 'navidrome', icon: Radio, labelKey: 'app.sidebarNavidrome' },
    ytmusic: { active: 'ytmusic', icon: Music2, labelKey: 'app.sidebarYtmusic' },
};

const AppSidebar: React.FC<AppSidebarProps> = ({
    active,
    isDaylight,
    collapsed,
    forceHidden = false,
    navidromeEnabled = false,
    hasPersonalLibrary = false,
    onToggleCollapsed,
    onOpenHome,
    onOpenCharts,
    onOpenPodcast,
    onOpenRadio,
    onOpenLocal,
    onOpenNavidrome,
    onOpenYtmusic,
    onOpenHistory,
    onOpenSettings,
}) => {
    const { t } = useTranslation();
    const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);

    const shellClass = 'text-[color:var(--shell-text)]';
    const brandMuted = 'text-[color:var(--shell-muted-text)]';
    const sectionLabel = 'text-[color:var(--shell-muted-text)]';
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

    const navActions: Partial<Record<SidebarNavItemId, () => void>> = {
        charts: onOpenCharts,
        library: onOpenHome,
        radio: onOpenRadio,
        podcast: onOpenPodcast,
        history: onOpenHistory,
        local: onOpenLocal,
        navidrome: onOpenNavidrome,
        ytmusic: onOpenYtmusic,
    };
    const navGroups = resolveSidebarNavGroups({
        hasPersonalLibrary: Boolean(hasPersonalLibrary && onOpenHome),
        hasRadio: Boolean(onOpenRadio),
        hasHistory: Boolean(onOpenHistory),
        hasNavidrome: Boolean(isNavidromeUiEnabled() && navidromeEnabled && onOpenNavidrome),
        hasYtmusic: Boolean(
            isYtmusicUiEnabled()
            && onOpenYtmusic
            && typeof window !== 'undefined'
            && Boolean(window.electron),
        ),
    });

    // Immersive fullscreen owns temporary hide; user collapse preference stays untouched.
    if (forceHidden) {
        return null;
    }

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
                    style={{
                        backgroundColor: 'var(--shell-sidebar-glass)',
                        color: 'var(--shell-text)',
                        borderColor: 'var(--shell-border)',
                    }}
                    className={`pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 ${expandToggleClass.replace(/bg-\S+/, '')}`}
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
            className={`relative z-[50] flex h-full w-[220px] shrink-0 flex-col border-r backdrop-blur-2xl transition-all duration-300 ease-out ${shellClass}`}
            style={{
                WebkitAppRegion: 'no-drag',
                ['--app-sidebar-width' as string]: '220px',
                backgroundColor: 'var(--shell-sidebar-glass)',
                borderColor: 'var(--shell-border)',
            } as React.CSSProperties}
            data-collapsed="false"
        >
            <div className="px-5 pt-10 pb-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-lg font-bold tracking-tight">{t('app.productName')}</div>
                        <div className={`mt-1 text-[11px] ${brandMuted}`}>
                            {t('app.productNameZh')}
                            <span className="mx-1.5 opacity-40">·</span>
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

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                {navGroups.map((group, groupIndex) => (
                    <div key={group.id} className={groupIndex > 0 ? 'pt-3' : undefined}>
                        <div className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] ${sectionLabel}`}>
                            {t(group.titleKey)}
                        </div>
                        {group.items.map((itemId) => {
                            const meta = NAV_ITEM_META[itemId];
                            const onClick = navActions[itemId];
                            if (!onClick) return null;
                            const Icon = meta.icon;
                            const label = t(meta.labelKey);
                            return (
                                <button
                                    key={itemId}
                                    type="button"
                                    onClick={onClick}
                                    className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(active === meta.active)}`}
                                    aria-current={active === meta.active ? 'page' : undefined}
                                    title={label}
                                    aria-label={label}
                                >
                                    <Icon size={18} strokeWidth={2} />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Dock sits in the content column only — pin settings to the sidebar foot. */}
            {onOpenSettings ? (
                <div className="mt-auto shrink-0 border-t px-3 pb-4 pt-3" style={{
                    borderColor: 'var(--shell-border)',
                }}>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className={`relative flex w-full items-center rounded-xl text-sm font-medium transition-colors ${navButtonClass(false)}`}
                        title={t('app.sidebarSettings')}
                        aria-label={t('app.sidebarSettings')}
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
            ) : null}
        </aside>
    );
};

export default AppSidebar;
