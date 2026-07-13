import React, { useState } from 'react';
import { Activity, AlertCircle, Check, KeyRound, Loader2, Server, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NowPlayingConnectionStatus, StageSource, StageStatus, Theme } from '../../../types';
import type { NavidromeServerProfile } from '../../../types/navidrome';
import type { ObsBrowserSourceStatus } from '../../../types/obsBrowserSource';
import QQMusicLoginPanel from '../../shared/QQMusicLoginPanel';
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
import { isDiscordPresenceUiEnabled, isNavidromeUiEnabled } from '../../../utils/featureFlags';

// src/components/modal/settings/IntegrationSettingsSubview.tsx
// Integration settings for music providers, Stage, Now Playing, OBS, and Navidrome.

type NavidromeTestStatus = 'idle' | 'testing' | 'success' | 'failed';
type StageActionStatus = 'idle' | 'regenerating';
export type IntegrationSettingsChrome = {
    errorBgColor: string;
    errorTextColor: string;
    getAccentOptionStyle: (selected: boolean) => React.CSSProperties;
    isElectron: boolean;
    settingsCardClass: string;
    successBgColor: string;
    successTextColor: string;
    theme?: Theme;
    toggleOffBackgroundClass: string;
};

export type IntegrationStageModel = {
    enableNowPlayingStage: boolean;
    nowPlayingConnectionStatus: NowPlayingConnectionStatus;
    obsBrowserSourceStatus?: ObsBrowserSourceStatus | null;
    onCopyText: (text: string) => Promise<void>;
    onRegenerateObsBrowserSourceToken?: () => Promise<void> | void;
    onRegenerateStageToken?: () => Promise<void> | void;
    onStageSourceChange?: (source: StageSource) => Promise<void> | void;
    onToggleObsBrowserSource?: (enabled: boolean) => Promise<void> | void;
    onToggleNowPlayingStage?: (enabled: boolean) => Promise<void> | void;
    onToggleStageMode?: (enabled: boolean) => Promise<void> | void;
    setStageActionStatus: (status: StageActionStatus) => void;
    setStageAddressCopied: (copied: boolean) => void;
    stageActionStatus: StageActionStatus;
    stageAddressCopied: boolean;
    stageSource?: StageSource | null;
    stageStatus?: StageStatus | null;
};

export type IntegrationNavidromeModel = {
    navidromeConfigured: boolean;
    navidromeEnabled: boolean;
    navidromePassword: string;
    navidromeServerProfile: NavidromeServerProfile | null;
    navidromeTestStatus: NavidromeTestStatus;
    navidromeUrl: string;
    navidromeUsername: string;
    onClearNavidrome: () => void;
    onToggleNavidrome: (enabled: boolean) => void;
    setNavidromePassword: (value: string) => void;
    setNavidromeUrl: (value: string) => void;
    setNavidromeUsername: (value: string) => void;
    testNavidromeConnection: () => Promise<void> | void;
};

export type IntegrationDiscordModel = {
    enabled: boolean;
    onToggle: (enabled: boolean) => Promise<void> | void;
    status?: ElectronDiscordPresenceStatus | null;
};

type IntegrationSettingsSubviewProps = {
    chrome: IntegrationSettingsChrome;
    discord?: IntegrationDiscordModel;
    navidrome: IntegrationNavidromeModel;
    stage: IntegrationStageModel;
};

const maskStageToken = (token: string | null | undefined) => {
    if (!token) return '未生成';
    if (token.length <= 10) return token;
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const getNowPlayingStatusLabel = (status: NowPlayingConnectionStatus) => {
    if (status === 'connected') return '已连接';
    if (status === 'connecting') return '连接中';
    if (status === 'error') return '连接失败';
    return '未启用';
};

const IntegrationSettingsSubview: React.FC<IntegrationSettingsSubviewProps> = ({
    chrome,
    discord,
    navidrome,
    stage,
}) => {
    const {
        errorBgColor,
        errorTextColor,
        getAccentOptionStyle,
        isElectron,
        settingsCardClass,
        successBgColor,
        successTextColor,
        theme,
        toggleOffBackgroundClass,
    } = chrome;
    const {
        enableNowPlayingStage,
        nowPlayingConnectionStatus,
        obsBrowserSourceStatus,
        onCopyText,
        onRegenerateObsBrowserSourceToken,
        onRegenerateStageToken,
        onStageSourceChange,
        onToggleObsBrowserSource,
        onToggleNowPlayingStage,
        onToggleStageMode,
        setStageActionStatus,
        setStageAddressCopied,
        stageActionStatus,
        stageAddressCopied,
        stageSource,
        stageStatus,
    } = stage;
    const {
        navidromeConfigured,
        navidromeEnabled,
        navidromePassword,
        navidromeServerProfile,
        navidromeTestStatus,
        navidromeUrl,
        navidromeUsername,
        onClearNavidrome,
        onToggleNavidrome,
        setNavidromePassword,
        setNavidromeUrl,
        setNavidromeUsername,
        testNavidromeConnection,
    } = navidrome;
    const {
        enabled: discordPresenceEnabled,
        onToggle: onToggleDiscordPresence,
        status: discordPresenceStatus,
    } = discord ?? { enabled: false, onToggle: async () => undefined, status: null };
    const { t } = useTranslation();
    const [obsAddressCopied, setObsAddressCopied] = useState(false);
    const nowPlayingStatusLabel = getNowPlayingStatusLabel(nowPlayingConnectionStatus);
    const showDiscordPresence = isDiscordPresenceUiEnabled() && Boolean(discord);
    const discordPresenceStatusLabel = (() => {
        if (!discordPresenceStatus?.enabled) return t('options.discordPresenceDisabled') || 'Disabled';
        if (discordPresenceStatus.connected) return t('options.discordPresenceConnected') || 'Connected';
        return t('options.discordPresenceDisconnected') || 'Disconnected';
    })();
    const navidromeExtensionCount = navidromeServerProfile?.openSubsonicExtensions.length ?? 0;
    const navidromeFolderCount = navidromeServerProfile?.musicFolders.length ?? 0;
    const navidromeServerLabel = navidromeServerProfile?.serverVersion
        || navidromeServerProfile?.serverType
        || t('navidrome.serverProfileUnavailable');
    const handleCopyStageAddress = async (address: string) => {
        await onCopyText(address);
        setStageAddressCopied(true);
        window.setTimeout(() => setStageAddressCopied(false), 1600);
    };

    const handleCopyObsAddress = async (address: string) => {
        await onCopyText(address);
        setObsAddressCopied(true);
        window.setTimeout(() => setObsAddressCopied(false), 1600);
    };

    const showStreamingAdvanced = true;
    const isStreamingStatusLoading = isElectron && !obsBrowserSourceStatus && !stageStatus;

    return (
        <>
            {isElectron && showDiscordPresence && (
                <section>
                    <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                        <Activity size={14} /> {t('options.discordRichPresence') || 'Discord Rich Presence'}
                    </h3>
                    <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className={settingsTitleClass} style={settingsTitleStyle}>
                                    {t('options.enableDiscordRichPresence') || 'Enable Discord playback status'}
                                </div>
                                <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                    {t('options.discordRichPresenceDesc') || 'Show the current Lyra track in Discord desktop. Lyra connects with its built-in application identity.'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => void onToggleDiscordPresence(!discordPresenceEnabled)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${!discordPresenceEnabled ? toggleOffBackgroundClass : ''}`}
                                style={{ backgroundColor: discordPresenceEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                                aria-label={t('options.enableDiscordRichPresence') || 'Enable Discord playback status'}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${discordPresenceEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] ${discordPresenceStatus?.connected ? successBgColor : errorBgColor} ${discordPresenceStatus?.connected ? successTextColor : errorTextColor}`}>
                                {discordPresenceStatusLabel}
                            </span>
                            {discordPresenceStatus?.error && (
                                <span className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                                    {discordPresenceStatus.error}
                                </span>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {showStreamingAdvanced && (
                <SettingsAdvancedSection title={t('options.advancedStreamingStage') || '推流与舞台'}>
                    {isStreamingStatusLoading && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${settingsCardClass}`}>
                            <Loader2 size={16} className="animate-spin shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <div className={settingsDescClass} style={settingsDescStyle}>
                                {t('options.streamingStageLoading') || '正在加载推流与舞台状态…'}
                            </div>
                        </div>
                    )}

                    {isElectron && obsBrowserSourceStatus && (
                        <section>
                            <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                                <Server size={14} /> {t('options.obsBrowserSource') || 'OBS Browser Source'}
                            </h3>
                            <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                                            {t('options.enableObsBrowserSource') || 'Enable OBS browser source'}
                                        </div>
                                        <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                                            {t('options.obsBrowserSourceDesc') || 'Renders the full lyrics animation in OBS without audio. When connected, the main window stops rendering the heavy visualizer.'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => void onToggleObsBrowserSource?.(!obsBrowserSourceStatus.enabled)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${!obsBrowserSourceStatus.enabled ? toggleOffBackgroundClass : ''}`}
                                        style={{ backgroundColor: obsBrowserSourceStatus.enabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                                        aria-label={t('options.enableObsBrowserSource') || 'Enable OBS browser source'}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${obsBrowserSourceStatus.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {obsBrowserSourceStatus.enabled && (
                                    <div className="space-y-3">
                                        <div className={`rounded-xl border p-3 space-y-3 ${settingsCardClass}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className={`mb-2 uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                        {t('options.obsBrowserSourceAddress') || 'OBS URL'}
                                                    </div>
                                                    <div className="text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                                                        {obsBrowserSourceStatus.url ?? 'http://127.0.0.1'}
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] ${obsBrowserSourceStatus.clientCount > 0 ? successBgColor : errorBgColor} ${obsBrowserSourceStatus.clientCount > 0 ? successTextColor : errorTextColor}`}>
                                                    {t('options.obsBrowserSourceClients') || 'Clients'}: {obsBrowserSourceStatus.clientCount}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => obsBrowserSourceStatus.url ? void handleCopyObsAddress(obsBrowserSourceStatus.url) : undefined}
                                                    disabled={!obsBrowserSourceStatus.url}
                                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors disabled:opacity-40 flex items-center gap-2"
                                                    style={{ color: obsAddressCopied ? '#86efac' : 'var(--text-primary)' }}
                                                >
                                                    {obsAddressCopied ? <Check size={14} /> : null}
                                                    {obsAddressCopied
                                                        ? (t('options.stageAddressCopied') || 'Copied')
                                                        : (t('options.copyObsBrowserSourceAddress') || 'Copy OBS URL')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void onRegenerateObsBrowserSourceToken?.()}
                                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {t('options.regenerateObsBrowserSourceToken') || 'Regenerate Token'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {isElectron && stageStatus && (
                        <section>
                            <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                                <Server size={14} /> 舞台模式
                            </h3>
                            <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                                            启用 Stage API
                                        </div>
                                        <div className={`${settingsDescClass} max-w-[320px]`} style={settingsDescStyle}>
                                            开启后会暴露本机 HTTP 接口，供 Stage 客户端读取当前播放和歌词状态。
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => void onToggleStageMode?.(!(stageStatus.modeEnabled ?? false))}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${!(stageStatus.modeEnabled ?? false) ? toggleOffBackgroundClass : ''}`}
                                        style={{ backgroundColor: stageStatus.modeEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${stageStatus.modeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {stageStatus.modeEnabled && (
                                    <div className="space-y-3">
                                        <div className={`rounded-xl border p-3 space-y-2 ${settingsCardClass}`}>
                                            <div className={`uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                Source
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { value: 'stage-api', label: 'Stage API' },
                                                    { value: 'now-playing', label: 'Now Playing' },
                                                ] as Array<{ value: StageSource; label: string }>).map((option) => {
                                                    const selected = stageSource === option.value;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => void onStageSourceChange?.(option.value)}
                                                            className="rounded-xl border px-3 py-3 text-sm transition-colors"
                                                            style={{ ...getAccentOptionStyle(selected), color: 'var(--text-primary)' }}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {stageSource === 'now-playing' ? (
                                            <div className={`rounded-xl border p-3 space-y-2 ${settingsCardClass}`}>
                                                <div className={`uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                    Now Playing
                                                </div>
                                                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    连接状态：{nowPlayingStatusLabel}
                                                </div>
                                                <div className={settingsDescClass} style={settingsDescStyle}>
                                                    固定连接 `ws://localhost:9863/api/ws/lyric`，请先在本机启动 now-playing 服务。
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`rounded-xl border p-3 space-y-3 ${settingsCardClass}`}>
                                                    <div>
                                                        <div className={`mb-2 uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                            {t('options.stageAddress') || 'Stage Address'}
                                                        </div>
                                                        <div className="text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                                                            {`http://127.0.0.1:${stageStatus.port}`}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleCopyStageAddress(`http://127.0.0.1:${stageStatus.port}`)}
                                                            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors flex items-center gap-2"
                                                            style={{ color: stageAddressCopied ? '#86efac' : 'var(--text-primary)' }}
                                                        >
                                                            {stageAddressCopied ? <Check size={14} /> : null}
                                                            {stageAddressCopied
                                                                ? (t('options.stageAddressCopied') || 'Copied')
                                                                : (t('options.copyStageAddress') || 'Copy Address')}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={`rounded-xl border p-3 space-y-3 ${settingsCardClass}`}>
                                                    <div>
                                                        <div className={`mb-2 uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                            {t('options.stageToken') || 'Bearer Token'}
                                                        </div>
                                                        <div className="text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                                                            {maskStageToken(stageStatus.token)}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void onCopyText(stageStatus.token || '')}
                                                            disabled={!stageStatus.token}
                                                            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors disabled:opacity-40"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {t('options.copyStageToken') || 'Copy Token'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                setStageActionStatus('regenerating');
                                                                try {
                                                                    await onRegenerateStageToken?.();
                                                                } finally {
                                                                    setStageActionStatus('idle');
                                                                }
                                                            }}
                                                            disabled={stageActionStatus !== 'idle'}
                                                            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors disabled:opacity-40"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {stageActionStatus === 'regenerating'
                                                                ? (t('options.stageTokenRegenerating') || 'Regenerating...')
                                                                : (t('options.regenerateStageToken') || 'Regenerate Token')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {!isElectron && (
                        <section>
                            <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                                <Server size={14} /> 舞台
                            </h3>
                            <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                                            启用 Now Playing
                                        </div>
                                        <div className={`${settingsDescClass} max-w-[320px]`} style={settingsDescStyle}>
                                            开启后首页显示舞台入口，并通过本机 localhost 连接 now-playing 服务。
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => void onToggleNowPlayingStage?.(!enableNowPlayingStage)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${!enableNowPlayingStage ? toggleOffBackgroundClass : ''}`}
                                        style={{ backgroundColor: enableNowPlayingStage ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableNowPlayingStage ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {enableNowPlayingStage && (
                                    <div className={`rounded-xl border p-3 space-y-2 ${settingsCardClass}`}>
                                        <div className={`uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                            Now Playing
                                        </div>
                                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                            连接状态：{nowPlayingStatusLabel}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </SettingsAdvancedSection>
            )}

            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <KeyRound size={14} /> {t('options.qqMusicAccount') || 'QQ Music Account'}
                </h3>
                <QQMusicLoginPanel
                    variant="settings"
                    cardClass={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}
                    successBgColor={successBgColor}
                    successTextColor={successTextColor}
                    errorBgColor={errorBgColor}
                    errorTextColor={errorTextColor}
                />
            </section>

            {isNavidromeUiEnabled() ? (
            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Server size={14} /> {t('navidrome.settings') || 'Navidrome Settings'}
                    {navidromeEnabled && navidromeConfigured && (
                        <span className={`ml-2 px-2 py-0.5 ${successBgColor} ${successTextColor} text-xs rounded-full font-normal normal-case`}>
                            {t('navidrome.connectionSuccess') || 'Connected'}
                        </span>
                    )}
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {t('navidrome.enable') || 'Enable Navidrome'}
                        </span>
                        <button
                            onClick={() => onToggleNavidrome(!navidromeEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${!navidromeEnabled ? toggleOffBackgroundClass : ''}`}
                            style={{ backgroundColor: navidromeEnabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${navidromeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {navidromeEnabled && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {t('navidrome.serverUrl') || 'Server URL'}
                                </label>
                                <input
                                    type="url"
                                    value={navidromeUrl}
                                    onChange={(e) => setNavidromeUrl(e.target.value)}
                                    placeholder={t('navidrome.serverUrlPlaceholder') || 'e.g., http://localhost:4533'}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {t('navidrome.username') || 'Username'}
                                </label>
                                <input
                                    type="text"
                                    value={navidromeUsername}
                                    onChange={(e) => setNavidromeUsername(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {t('navidrome.password') || 'Password'}
                                </label>
                                <input
                                    type="password"
                                    value={navidromePassword}
                                    onChange={(e) => setNavidromePassword(e.target.value)}
                                    placeholder={navidromeConfigured ? '••••••••' : ''}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>

                            {navidromeConfigured && navidromeServerProfile && (
                                <div className="border-t border-white/10 pt-3">
                                    <div className="flex items-center justify-center text-xs opacity-80 overflow-hidden whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                        <span className="truncate" title={navidromeServerLabel}>{navidromeServerLabel}</span>
                                        <span className="opacity-50 mx-1.5 shrink-0">·</span>
                                        <span className="truncate" title={navidromeServerProfile.user?.username || navidromeUsername}>
                                            {navidromeServerProfile.user?.username || navidromeUsername}
                                        </span>
                                        {navidromeServerProfile.openSubsonic && (
                                            <>
                                                <span className="opacity-50 mx-1.5 shrink-0">·</span>
                                                <span className="shrink-0">OpenSubsonic ({navidromeExtensionCount})</span>
                                            </>
                                        )}
                                        <span className="opacity-50 mx-1.5 shrink-0">·</span>
                                        <span className="shrink-0">{t('navidrome.musicFolders') || 'Libraries'} ({navidromeFolderCount})</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {navidromeEnabled && (
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={testNavidromeConnection}
                                disabled={navidromeTestStatus === 'testing' || !navidromeUrl || !navidromeUsername || !navidromePassword}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {navidromeTestStatus === 'testing' ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {t('navidrome.testing') || 'Connecting...'}
                                    </>
                                ) : navidromeTestStatus === 'success' ? (
                                    <>
                                        <Check size={16} className={successTextColor} />
                                        {t('navidrome.connectionSuccess') || 'Connected'}
                                    </>
                                ) : navidromeTestStatus === 'failed' ? (
                                    <>
                                        <AlertCircle size={16} className={errorTextColor} />
                                        {t('navidrome.connectionFailed') || 'Failed'}
                                    </>
                                ) : (
                                    <>
                                        <Server size={16} />
                                        {t('navidrome.testConnection') || 'Test Connection'}
                                    </>
                                )}
                            </button>

                            {navidromeConfigured && (
                                <button
                                    onClick={onClearNavidrome}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${errorBgColor} hover:bg-red-500/20 ${errorTextColor}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>
            ) : null}
        </>
    );
};

export default IntegrationSettingsSubview;
