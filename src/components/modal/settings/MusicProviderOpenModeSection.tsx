import React, { useEffect, useState } from 'react';
import { FolderOpen, Loader2, Plug, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMusicProviderCatalogStore } from '../../../stores/useMusicProviderCatalogStore';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { mergeProviderCatalogIds } from '../../../utils/musicProviders/providerManifestMath';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsFootnoteClass,
    settingsFootnoteStyle,
    settingsSectionTitleClass,
    settingsSectionTitleStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/MusicProviderOpenModeSection.tsx
// Open-mode music provider plugins: local directory, catalog list, rescan.

type MusicProviderOpenModeSectionProps = {
    isElectron: boolean;
    settingsCardClass: string;
};

const MusicProviderOpenModeSection: React.FC<MusicProviderOpenModeSectionProps> = ({
    isElectron,
    settingsCardClass,
}) => {
    const { t } = useTranslation();
    const providers = useMusicProviderCatalogStore((state) => state.providers);
    const userPluginsDir = useMusicProviderCatalogStore((state) => state.userPluginsDir);
    const loading = useMusicProviderCatalogStore((state) => state.loading);
    const error = useMusicProviderCatalogStore((state) => state.error);
    const refresh = useMusicProviderCatalogStore((state) => state.refresh);
    const reload = useMusicProviderCatalogStore((state) => state.reload);
    const syncKnownProviders = useOnlineLibraryFilterStore((state) => state.syncKnownProviders);
    const [pluginsDir, setPluginsDir] = useState<string | null>(userPluginsDir);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        setPluginsDir(userPluginsDir);
    }, [userPluginsDir]);

    useEffect(() => {
        const electronBridge = typeof window !== 'undefined' ? (window as any).electron : null;
        if (!electronBridge?.getMusicProviderPluginsDir) return;
        void electronBridge.getMusicProviderPluginsDir().then((dir: unknown) => {
            if (typeof dir === 'string' && dir.trim()) {
                setPluginsDir(dir);
            }
        }).catch(() => {
            // Sidecar dir from catalog remains the fallback.
        });
    }, []);

    const handleReload = async () => {
        setActionError(null);
        await reload();
        const next = useMusicProviderCatalogStore.getState();
        syncKnownProviders(mergeProviderCatalogIds(next.providers));
        if (next.error) {
            setActionError(next.error);
        }
    };

    const handleOpenDir = async () => {
        setActionError(null);
        const electronBridge = typeof window !== 'undefined' ? (window as any).electron : null;
        if (!electronBridge?.openMusicProviderPluginsDir) {
            setActionError(t('options.musicProviderOpenModeDesktopOnly'));
            return;
        }
        try {
            const result = await electronBridge.openMusicProviderPluginsDir();
            if (result && typeof result === 'object' && result.ok === false && result.error) {
                setActionError(String(result.error));
            }
            if (result?.path) {
                setPluginsDir(String(result.path));
            }
        } catch (openError) {
            setActionError(openError instanceof Error ? openError.message : String(openError));
        }
    };

    const userPlugins = providers.filter((entry) => entry.source === 'user' || entry.source === 'env');
    const builtinPlugins = providers.filter((entry) => entry.source === 'builtin');

    return (
        <section>
            <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                <Plug size={14} /> {t('options.musicProviderOpenMode')}
            </h3>
            <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                <div className="space-y-1">
                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                        {t('options.musicProviderOpenModeTitle')}
                    </div>
                    <div className={`${settingsDescClass} max-w-[520px]`} style={settingsDescStyle}>
                        {t('options.musicProviderOpenModeDesc')}
                    </div>
                    <div className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                        {t('options.musicProviderOpenModeTrust')}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className={`text-[11px] font-semibold uppercase tracking-wide opacity-60`}>
                        {t('options.musicProviderPluginsDir')}
                    </div>
                    <code className="block text-[12px] break-all opacity-80">
                        {pluginsDir || t('options.musicProviderPluginsDirUnknown')}
                    </code>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void handleReload()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black shadow-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        {t('options.musicProviderRescan')}
                    </button>
                    {isElectron && (
                        <button
                            type="button"
                            onClick={() => void handleOpenDir()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20"
                        >
                            <FolderOpen size={14} />
                            {t('options.musicProviderOpenFolder')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 disabled:opacity-50"
                    >
                        {t('options.musicProviderRefreshList')}
                    </button>
                </div>

                {(actionError || error) && (
                    <div className="text-xs text-red-400">
                        {actionError || error}
                    </div>
                )}

                <div className="space-y-2">
                    <div className={`text-[11px] font-semibold uppercase tracking-wide opacity-60`}>
                        {t('options.musicProviderLoaded', { count: providers.length })}
                    </div>
                    {providers.length === 0 ? (
                        <div className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                            {t('options.musicProviderLoadedEmpty')}
                        </div>
                    ) : (
                        <ul className="space-y-1.5 max-h-48 overflow-auto pr-1">
                            {[...userPlugins, ...builtinPlugins].map((entry) => (
                                <li
                                    key={`${entry.source}:${entry.id}`}
                                    className="flex items-center justify-between gap-3 text-xs rounded-lg px-2.5 py-1.5 bg-black/5 dark:bg-white/5"
                                >
                                    <div className="min-w-0">
                                        <div className="font-semibold truncate">
                                            {entry.ui?.label || entry.name || entry.id}
                                        </div>
                                        <div className="opacity-60 truncate">
                                            {entry.id} · v{entry.version} · {entry.source}
                                        </div>
                                    </div>
                                    <div className="opacity-50 shrink-0">
                                        {(entry.capabilities || []).join(', ')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MusicProviderOpenModeSection;
