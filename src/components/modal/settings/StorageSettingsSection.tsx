import React from 'react';
import { Command, Database, Disc3, ExternalLink, FolderOpen, Layers, Loader2, Pencil, PlayCircle, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../../types';
import SettingsAdvancedSection from './SettingsAdvancedSection';
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

// src/components/modal/settings/StorageSettingsSection.tsx
// Shared storage, media cache, and download directory settings.

type CacheCategory = 'playlist' | 'lyrics' | 'cover' | 'media';

type CacheSizes = Record<CacheCategory, string>;

type StorageSettingsSectionProps = {
    cacheDirectory: string;
    cacheDirectoryIsDefault: boolean;
    cacheDirectoryStatus: 'idle' | 'choosing';
    cacheSizes: CacheSizes;
    downloadDirectory: string;
    downloadDirectoryIsDefault: boolean;
    downloadDirectoryStatus: 'idle' | 'choosing' | 'opening' | 'resetting';
    enableMediaCache: boolean;
    errorTextColor: string;
    isCleaning: string | null;
    isElectron: boolean;
    mediaCount: number;
    onChooseCacheDirectory: () => void;
    onChooseDownloadDirectory: () => void;
    onClear: (category: CacheCategory) => void;
    onClearAll: () => void;
    onOpenDownloadDirectory: () => void;
    onResetDownloadDirectory: () => void;
    onToggleMediaCache: (enabled: boolean) => void;
    settingsCardClass: string;
    settingsIconClass?: string;
    theme?: Theme;
    toggleOffBackgroundClass: string;
    useInsetCacheRows?: boolean;
};

const StorageSettingsSection: React.FC<StorageSettingsSectionProps> = ({
    cacheDirectory,
    cacheDirectoryIsDefault,
    cacheDirectoryStatus,
    cacheSizes,
    downloadDirectory,
    downloadDirectoryIsDefault,
    downloadDirectoryStatus,
    enableMediaCache,
    errorTextColor,
    isCleaning,
    isElectron,
    mediaCount,
    onChooseCacheDirectory,
    onChooseDownloadDirectory,
    onClear,
    onClearAll,
    onOpenDownloadDirectory,
    onResetDownloadDirectory,
    onToggleMediaCache,
    settingsCardClass,
    settingsIconClass,
    theme,
    toggleOffBackgroundClass,
    useInsetCacheRows = false,
}) => {
    const { t } = useTranslation();
    const cacheRowClass = useInsetCacheRows
        ? `flex items-center justify-between p-3 rounded-xl border ${settingsCardClass}`
        : 'flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5';
    const iconClass = useInsetCacheRows && settingsIconClass
        ? `p-2 rounded-lg opacity-60 ${settingsIconClass}`
        : 'p-2 bg-white/5 rounded-lg opacity-60';
    const cacheItems = [
        { id: 'playlist' as const, label: t('options.playlistData') || 'Playlist Data', size: cacheSizes.playlist, icon: Layers },
        { id: 'lyrics' as const, label: t('options.lyrics') || 'Lyrics', size: cacheSizes.lyrics, icon: Command },
        { id: 'cover' as const, label: t('options.covers') || 'Covers', size: cacheSizes.cover, icon: Disc3 },
        { id: 'media' as const, label: t('options.mediaFiles') || 'Media Files', size: cacheSizes.media, icon: PlayCircle },
    ];
    const downloadBusy = downloadDirectoryStatus !== 'idle';

    return (
        <>
            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Database size={14} /> {t('options.cacheDetails') || 'Cache Storage'}
                    <button
                        onClick={onClearAll}
                        disabled={isCleaning === 'all'}
                        className={`ml-auto text-xs font-normal normal-case tracking-normal px-2 py-1 hover:bg-white/10 rounded-lg ${errorTextColor} opacity-60 hover:opacity-100 transition-all disabled:opacity-20 flex items-center gap-1`}
                    >
                        {isCleaning === 'all' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        {t('options.clearAll') || '清空所有'}
                    </button>
                </h3>

                <div className="space-y-3">
                    {cacheItems.map((item) => (
                        <div key={item.id} className={cacheRowClass}>
                            <div className="flex items-center gap-3">
                                <div className={iconClass}>
                                    <item.icon size={16} />
                                </div>
                                <div>
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>{item.label}</div>
                                    <div className={settingsDescClass} style={settingsDescStyle}>{item.size}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => onClear(item.id)}
                                disabled={isCleaning === item.id}
                                className={`p-2 hover:bg-white/10 rounded-lg ${errorTextColor} opacity-60 hover:opacity-100 transition-all disabled:opacity-20`}
                                title="Clear"
                            >
                                {isCleaning === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Database size={14} /> {t('options.mediaCache') || 'Media Cache'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className={settingsTitleClass} style={settingsTitleStyle}>
                                {t('options.enableMediaCache') || 'Cache Songs'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[260px]`} style={settingsDescStyle}>
                                {t('options.enableMediaCacheDesc') || 'Cache audio after playback for offline listening. Some online sources cannot be cached due to CORS.'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleMediaCache(!enableMediaCache)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${!enableMediaCache ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: enableMediaCache ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableMediaCache ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center" style={settingsDescStyle}>
                        <span className={settingsDescClass}>{t('options.cachedSongsCount') || 'Cached Songs'}:</span>
                        <span className={`font-mono ${settingsDescClass}`}>{mediaCount}</span>
                    </div>
                </div>

                {isElectron && (
                    <SettingsAdvancedSection>
                        <div className={`p-4 rounded-xl border space-y-3 ${settingsCardClass}`}>
                            <div className="space-y-1">
                                <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                    <FolderOpen size={14} />
                                    {t('options.cacheDirectory') || 'Cache Directory'}
                                </div>
                                <div className={settingsDescClass} style={settingsDescStyle}>
                                    {t('options.cacheDirectoryDesc') || 'Choose where large desktop cache files should be stored.'}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 bg-black/10 rounded-lg border border-white/5 px-3 py-2 min-w-0">
                                    <div className="text-[11px] break-all font-mono" style={{ color: 'var(--text-primary)' }}>
                                        {cacheDirectory || '...'}
                                    </div>
                                    <div className={`mt-1 ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                        {cacheDirectoryIsDefault
                                            ? (t('options.cacheDirectoryDefaultHint') || 'Using the default desktop cache location.')
                                            : (t('options.cacheDirectoryCustomHint') || 'Using a custom cache location.')}
                                    </div>
                                </div>
                                <button
                                    onClick={onChooseCacheDirectory}
                                    disabled={cacheDirectoryStatus !== 'idle'}
                                    className="shrink-0 w-12 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ color: 'var(--text-primary)' }}
                                    title={t('options.chooseCacheDirectory') || 'Choose Folder'}
                                    aria-label={t('options.chooseCacheDirectory') || 'Choose Folder'}
                                >
                                    {cacheDirectoryStatus === 'choosing' ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                                </button>
                            </div>
                        </div>
                    </SettingsAdvancedSection>
                )}
            </section>

            {isElectron && (
                <section className="space-y-3">
                    <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                        <FolderOpen size={14} /> {t('options.downloadDirectory') || 'Download Directory'}
                    </h3>
                    <div className={`p-4 rounded-xl border space-y-3 ${settingsCardClass}`}>
                        <div className="space-y-1">
                            <div className={settingsTitleClass} style={settingsTitleStyle}>
                                {t('options.downloadDirectoryTitle') || 'Local downloads'}
                            </div>
                            <div className={settingsDescClass} style={settingsDescStyle}>
                                {t('options.downloadDirectoryDesc') || 'Choose a Finder-friendly folder for songs saved to disk. Files use readable names under per-source subfolders.'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/10 rounded-lg border border-white/5 px-3 py-2 min-w-0">
                                <div className="text-[11px] break-all font-mono" style={{ color: 'var(--text-primary)' }}>
                                    {downloadDirectory || '...'}
                                </div>
                                <div className={`mt-1 ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                    {downloadDirectoryIsDefault
                                        ? (t('options.downloadDirectoryDefaultHint') || 'Default: Music/Lyra')
                                        : (t('options.downloadDirectoryCustomHint') || 'Using a custom download location.')}
                                </div>
                            </div>
                            <button
                                onClick={onChooseDownloadDirectory}
                                disabled={downloadBusy}
                                className="shrink-0 w-12 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ color: 'var(--text-primary)' }}
                                title={t('options.chooseDownloadDirectory') || 'Choose Folder'}
                                aria-label={t('options.chooseDownloadDirectory') || 'Choose Folder'}
                            >
                                {downloadDirectoryStatus === 'choosing' ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={onOpenDownloadDirectory}
                                disabled={downloadBusy || !downloadDirectory}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {downloadDirectoryStatus === 'opening' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                                {t('options.openDownloadDirectory') || 'Open Folder'}
                            </button>
                            {!downloadDirectoryIsDefault && (
                                <button
                                    type="button"
                                    onClick={onResetDownloadDirectory}
                                    disabled={downloadBusy}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {downloadDirectoryStatus === 'resetting' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                    {t('options.resetDownloadDirectory') || 'Use Default Folder'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default StorageSettingsSection;
