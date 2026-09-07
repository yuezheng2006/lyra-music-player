import React, { useEffect, useState } from 'react';
import { Activity, ChevronRight, ListFilter, Monitor, PlayCircle, RefreshCw, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { QueueAddBehavior, Theme } from '../../../types';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { CustomSelect } from '../../shared/CustomSelect';
import { LYRIC_MATCH_SOURCES } from '../../../utils/lyrics/lyricMatchSources';
import { getLyricProviderPreferenceLabel } from '../../../utils/lyrics/lyricSourceLabels';
import SettingsAdvancedSection from './SettingsAdvancedSection';
import SleepTimerSettingsSection from './SleepTimerSettingsSection';
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

// src/components/modal/settings/PlaybackSettingsSubview.tsx
// Playback behavior and output-device settings extracted from the global settings modal.

interface AudioOutputDeviceOption {
    deviceId: string;
    label: string;
}

interface MediaDevicesWithAudioOutput extends MediaDevices {
    selectAudioOutput?: (options?: { deviceId?: string; }) => Promise<{ deviceId: string; label?: string; }>;
}

type PlaybackSettingsSubviewProps = {
    isOpen: boolean;
    isDaylight: boolean;
    onAudioOutputDeviceChange: (deviceId: string) => Promise<boolean> | boolean;
    onOpenLyricFilterSettings: () => void;
    settingsCardClass: string;
    theme?: Theme;
    utilityGhostButtonClass: string;
};

const stopMediaStream = (stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => track.stop());
};

const PlaybackSettingsSubview: React.FC<PlaybackSettingsSubviewProps> = ({
    isOpen,
    isDaylight,
    onAudioOutputDeviceChange,
    onOpenLyricFilterSettings,
    settingsCardClass,
    theme,
    utilityGhostButtonClass,
}) => {
    const { t } = useTranslation();
    const {
        audioOutputDeviceId,
        autoUseBestLyric,
        enableAlternativeLyricSources,
        enableBilibiliVideoBackground,
        localBeatAnalysisMode,
        localBeatAnalysisPromptPolicy,
        preferredAlternativeLyricSource,
        lyricsResolveBaseUrl,
        lyricsResolveApiKey,
        queueAddBehavior,
        onToggleAlternativeLyricSources,
        onToggleAutoUseBestLyric,
        onToggleEnableBilibiliVideoBackground,
        onLocalBeatAnalysisModeChange,
        onLocalBeatAnalysisPromptPolicyChange,
        onPreferredAlternativeLyricSourceChange,
        onLyricsResolveBaseUrlChange,
        onLyricsResolveApiKeyChange,
        onQueueAddBehaviorChange,
        globalLyricTimelineOffsetMs,
        onGlobalLyricTimelineOffsetMsChange,
    } = useSettingsUiStore(useShallow(state => ({
        audioOutputDeviceId: state.audioOutputDeviceId,
        autoUseBestLyric: state.autoUseBestLyric,
        enableAlternativeLyricSources: state.enableAlternativeLyricSources,
        enableBilibiliVideoBackground: state.enableBilibiliVideoBackground,
        localBeatAnalysisMode: state.localBeatAnalysisMode,
        localBeatAnalysisPromptPolicy: state.localBeatAnalysisPromptPolicy,
        preferredAlternativeLyricSource: state.preferredAlternativeLyricSource,
        lyricsResolveBaseUrl: state.lyricsResolveBaseUrl,
        lyricsResolveApiKey: state.lyricsResolveApiKey,
        queueAddBehavior: state.queueAddBehavior,
        onToggleAlternativeLyricSources: state.handleToggleAlternativeLyricSources,
        onToggleAutoUseBestLyric: state.handleToggleAutoUseBestLyric,
        onToggleEnableBilibiliVideoBackground: state.handleToggleEnableBilibiliVideoBackground,
        onLocalBeatAnalysisModeChange: state.handleSetLocalBeatAnalysisMode,
        onLocalBeatAnalysisPromptPolicyChange: state.handleSetLocalBeatAnalysisPromptPolicy,
        onPreferredAlternativeLyricSourceChange: state.handleSetPreferredAlternativeLyricSource,
        onLyricsResolveBaseUrlChange: state.handleSetLyricsResolveBaseUrl,
        onLyricsResolveApiKeyChange: state.handleSetLyricsResolveApiKey,
        onQueueAddBehaviorChange: state.handleSetQueueAddBehavior,
        globalLyricTimelineOffsetMs: state.globalLyricTimelineOffsetMs,
        onGlobalLyricTimelineOffsetMsChange: state.handleSetGlobalLyricTimelineOffsetMs,
    })));
    const [audioOutputDevices, setAudioOutputDevices] = useState<AudioOutputDeviceOption[]>([]);
    const [isAudioOutputDevicesLoading, setIsAudioOutputDevicesLoading] = useState(false);
    const [audioOutputDevicesError, setAudioOutputDevicesError] = useState<string | null>(null);
    const [isSelectingAudioOutput, setIsSelectingAudioOutput] = useState(false);
    const mediaDevicesWithAudioOutput = navigator.mediaDevices as MediaDevicesWithAudioOutput | undefined;
    const supportsAudioOutputSelection = typeof window !== 'undefined'
        && typeof navigator !== 'undefined'
        && typeof navigator.mediaDevices?.enumerateDevices === 'function'
        && 'setSinkId' in HTMLMediaElement.prototype;
    const accentOutlineColor = theme?.accentColor || (isDaylight ? '#44403c' : '#f4f4f5');
    const toggleOffBackgroundClass = isDaylight ? 'bg-zinc-300/90' : 'bg-white/10';

    const renderToggle = (checked: boolean, onChange: () => void) => (
        <button
            type="button"
            onClick={onChange}
            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${checked ? '' : toggleOffBackgroundClass}`}
            style={{ backgroundColor: checked ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
            aria-pressed={checked}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );

    const getAccentOptionStyle = (selected: boolean) => (
        selected
            ? {
                borderColor: accentOutlineColor,
                boxShadow: `inset 0 0 0 1px ${accentOutlineColor}`,
                backgroundColor: isDaylight ? `${accentOutlineColor}12` : `${accentOutlineColor}18`,
            }
            : {
                borderColor: isDaylight ? 'rgba(24, 24, 27, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: isDaylight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.05)',
            }
    );

    const loadAudioOutputDevices = async () => {
        if (!supportsAudioOutputSelection) {
            setAudioOutputDevices([]);
            setAudioOutputDevicesError(t('options.audioOutputUnsupported') || '当前环境不支持切换播放设备。');
            return;
        }

        setIsAudioOutputDevicesLoading(true);
        setAudioOutputDevicesError(null);

        let permissionProbeStream: MediaStream | null = null;

        try {
            let devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            const hasMissingLabels = audioOutputs.some(device => !device.label?.trim());

            if (hasMissingLabels && typeof navigator.mediaDevices.getUserMedia === 'function') {
                try {
                    permissionProbeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    devices = await navigator.mediaDevices.enumerateDevices();
                } catch (permissionError) {
                    console.warn('[PlaybackSettingsSubview] Audio permission probe failed', permissionError);
                }
            }

            const outputs = devices
                .filter(device => device.kind === 'audiooutput')
                .map((device, index) => ({
                    deviceId: device.deviceId,
                    label: device.label || `${t('options.audioOutputUnnamed') || '播放设备'} ${index + 1}`,
                }));
            setAudioOutputDevices(outputs);
        } catch (error) {
            console.error('[PlaybackSettingsSubview] Failed to enumerate audio output devices', error);
            setAudioOutputDevicesError(t('options.audioOutputLoadFailed') || '读取播放设备失败。');
        } finally {
            stopMediaStream(permissionProbeStream);
            setIsAudioOutputDevicesLoading(false);
        }
    };

    const handleSelectAudioOutputDevice = async (deviceId: string) => {
        setAudioOutputDevicesError(null);

        if (!deviceId) {
            await onAudioOutputDeviceChange('');
            return;
        }

        if (!mediaDevicesWithAudioOutput?.selectAudioOutput) {
            await onAudioOutputDeviceChange(deviceId);
            return;
        }

        setIsSelectingAudioOutput(true);
        try {
            const selected = await mediaDevicesWithAudioOutput.selectAudioOutput({ deviceId });
            const applied = await onAudioOutputDeviceChange(selected.deviceId);
            if (applied) {
                await loadAudioOutputDevices();
            } else {
                setAudioOutputDevicesError(t('options.audioOutputSelectFailed') || '切换播放设备失败。');
            }
        } catch (error) {
            console.error('[PlaybackSettingsSubview] Failed to select audio output device', error);
            setAudioOutputDevicesError(t('options.audioOutputSelectFailed') || '切换播放设备失败。');
        } finally {
            setIsSelectingAudioOutput(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        void loadAudioOutputDevices();
    }, [isOpen]);

    return (
        <div className="space-y-5">
            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Activity size={14} /> {t('options.globalLyricTimelineOffset')}
                </h3>
                <div className={`p-4 rounded-xl border space-y-3 ${settingsCardClass}`}>
                    <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                        {t('options.globalLyricTimelineOffsetDesc')}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {[-50, -10, -1, 1, 10, 50].map((step) => (
                            <button
                                key={step}
                                type="button"
                                className={`rounded-full border px-3 py-1.5 text-sm ${utilityGhostButtonClass}`}
                                onClick={() => onGlobalLyricTimelineOffsetMsChange(globalLyricTimelineOffsetMs + step)}
                            >
                                {step > 0 ? `+${step}` : step} ms
                            </button>
                        ))}
                        <span className="font-mono text-sm" style={settingsTitleStyle}>
                            {globalLyricTimelineOffsetMs} ms
                        </span>
                    </div>
                </div>
            </section>
            <SleepTimerSettingsSection
                isDaylight={isDaylight}
                settingsCardClass={settingsCardClass}
                renderToggle={renderToggle}
            />
            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <PlayCircle size={14} /> 播放队列
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="space-y-1">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            加入队列的默认位置
                        </div>
                        <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                            加入播放队列按钮的默认行为。
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { value: 'append', label: '追加到末尾', desc: '加入到播放队列的末尾。' },
                            { value: 'next', label: '追加到下一首', desc: '加入当前播放歌曲后面。' },
                        ] as Array<{ value: QueueAddBehavior; label: string; desc: string }>).map((option) => {
                            const selected = queueAddBehavior === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onQueueAddBehaviorChange(option.value)}
                                    className="rounded-xl border px-3 py-3 text-left transition-colors"
                                    style={getAccentOptionStyle(selected)}
                                >
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {option.label}
                                    </div>
                                    <div className={`mt-1 ${settingsDescClass}`} style={settingsDescStyle}>
                                        {option.desc}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Activity size={14} /> {t('options.localBeatAnalysisMode') || '本地节奏分析'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="space-y-1">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.localBeatAnalysisPrompt') || '分析时机'}
                        </div>
                        <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                            {t('options.localBeatAnalysisPromptDesc') || '默认后台自动分析；若需要手动确认，可改为播放时询问。'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            {
                                value: 'auto' as const,
                                label: t('options.localBeatAnalysisPromptAuto', { defaultValue: '后台自动' }),
                                desc: t('options.localBeatAnalysisPromptAutoHint', { defaultValue: '不弹窗，听歌时静默完成' }),
                            },
                            {
                                value: 'ask' as const,
                                label: t('options.localBeatAnalysisPromptAsk', { defaultValue: '播放时询问' }),
                                desc: t('options.localBeatAnalysisPromptAskHint', { defaultValue: '每次本地曲弹出确认' }),
                            },
                        ]).map((option) => {
                            const selected = localBeatAnalysisPromptPolicy === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onLocalBeatAnalysisPromptPolicyChange(option.value)}
                                    className="rounded-xl border px-3 py-3 text-left transition-colors"
                                    style={getAccentOptionStyle(selected)}
                                >
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {option.label}
                                    </div>
                                    <div className={`mt-1 ${settingsDescClass}`} style={settingsDescStyle}>
                                        {option.desc}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="space-y-1 pt-2 border-t border-white/5">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.localBeatAnalysisDefaultMode') || '分析算法'}
                        </div>
                        <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                            {t('options.localBeatAnalysisModeDesc') || '本地或离线曲目的默认节奏分析算法。默认在后台静默分析，不打断听歌。'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            {
                                value: 'mr' as const,
                                label: t('localBeatAnalysis.cinemaTitle', { defaultValue: '电影视角' }),
                                desc: t('localBeatAnalysis.cinemaHint', { defaultValue: '日常综合节奏' }),
                            },
                            {
                                value: 'dj' as const,
                                label: t('localBeatAnalysis.pulseTitle', { defaultValue: '强节奏' }),
                                desc: t('localBeatAnalysis.pulseHint', { defaultValue: '长混音 / 鼓点密集' }),
                            },
                        ]).map((option) => {
                            const selected = localBeatAnalysisMode === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onLocalBeatAnalysisModeChange(option.value)}
                                    className="rounded-xl border px-3 py-3 text-left transition-colors"
                                    style={getAccentOptionStyle(selected)}
                                >
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {option.label}
                                    </div>
                                    <div className={`mt-1 ${settingsDescClass}`} style={settingsDescStyle}>
                                        {option.desc}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Settings2 size={14} /> {t('options.lyrics') || '歌词'}
                </h3>
                <div className={`rounded-xl border overflow-hidden ${settingsCardClass}`}>
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                <Settings2 size={14} />
                                {t('options.enableAlternativeLyricSources') || '更多歌词源'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                {t('options.enableAlternativeLyricSourcesDesc') || '启用备选歌词源（QQ音乐、酷狗音乐）'}
                            </div>
                        </div>
                        {renderToggle(enableAlternativeLyricSources, () => onToggleAlternativeLyricSources(!enableAlternativeLyricSources))}
                    </div>
                </div>
                {enableAlternativeLyricSources && (
                    <SettingsAdvancedSection>
                        <div className={`rounded-xl border overflow-hidden ${settingsCardClass}`}>
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                        <Settings2 size={14} />
                                        {t('options.autoUseBestLyric') || '自动使用最佳歌词'}
                                    </div>
                                    <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                        {t('options.autoUseBestLyricDesc') || '自动检索所有歌词源，若存在完美匹配的逐字歌词则自动优先采用。'}
                                    </div>
                                </div>
                                {renderToggle(autoUseBestLyric, () => onToggleAutoUseBestLyric(!autoUseBestLyric))}
                            </div>
                            <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--border-primary, rgba(255,255,255,0.06))' }}>
                                <div className="space-y-1">
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {t('settings.lyricMatchPriority')}
                                    </div>
                                    <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                        {t('settings.lyricMatchPriorityDesc')}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                    {LYRIC_MATCH_SOURCES.map((source) => {
                                        const option = { value: source, label: getLyricProviderPreferenceLabel(source) };
                                        const selected = preferredAlternativeLyricSource === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => onPreferredAlternativeLyricSourceChange(option.value)}
                                                className="rounded-xl border px-3 py-2 text-center transition-colors"
                                                style={getAccentOptionStyle(selected)}
                                            >
                                                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {option.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--border-primary, rgba(255,255,255,0.06))' }}>
                                <div className="space-y-1">
                                    <div className={settingsTitleClass} style={settingsTitleStyle}>
                                        {t('options.lyricsResolveService')}
                                    </div>
                                    <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                        {t('options.lyricsResolveServiceDesc')}
                                    </div>
                                </div>
                                <label className="block space-y-1">
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('options.lyricsResolveBaseUrl')}
                                    </span>
                                    <input
                                        type="url"
                                        value={lyricsResolveBaseUrl}
                                        onChange={(event) => onLyricsResolveBaseUrlChange(event.target.value)}
                                        placeholder="http://127.0.0.1:3010"
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    />
                                </label>
                                <label className="block space-y-1">
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('options.lyricsResolveApiKey')}
                                    </span>
                                    <input
                                        type="password"
                                        value={lyricsResolveApiKey}
                                        onChange={(event) => onLyricsResolveApiKeyChange(event.target.value)}
                                        placeholder="Bearer API key"
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        autoComplete="off"
                                    />
                                </label>
                            </div>
                        </div>
                    </SettingsAdvancedSection>
                )}
                <button
                    type="button"
                    onClick={onOpenLyricFilterSettings}
                    className={`w-full p-4 rounded-xl border transition-colors hover:bg-white/8 text-left ${settingsCardClass}`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                <ListFilter size={14} />
                                {t('options.lyricFilterRegex')}
                            </div>
                            <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                {t('options.lyricFilterRegexDesc')}
                            </div>
                        </div>
                        <ChevronRight size={18} className="shrink-0 opacity-60" style={{ color: 'var(--text-primary)' }} />
                    </div>
                </button>
            </section>

            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <PlayCircle size={14} /> {t('options.bilibiliPlaybackSection') || 'B 站播放'}
                </h3>
                <div className={`rounded-xl border overflow-hidden ${settingsCardClass}`}>
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                                <PlayCircle size={14} />
                                {t('options.enableBilibiliVideoBackground') || '显示 B 站视频背景'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                {t('options.enableBilibiliVideoBackgroundDesc') || '播放 B 站歌曲时在歌词下方显示静音视频；关闭后仅保留音频与 visualizer。'}
                            </div>
                        </div>
                        {renderToggle(
                            enableBilibiliVideoBackground,
                            () => onToggleEnableBilibiliVideoBackground(!enableBilibiliVideoBackground),
                        )}
                    </div>
                </div>
            </section>

            <section>
                <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                    <Monitor size={14} /> {t('options.audioOutputSettings') || '播放设备'}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className={settingsTitleClass} style={settingsTitleStyle}>
                                {t('options.audioOutputDevice') || '当前播放声卡'}
                            </div>
                            <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                                {t('options.audioOutputDeviceDesc') || '切换当前播放器的音频输出设备。Electron 桌面版优先支持，浏览器环境在支持 setSinkId 时也可使用。'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadAudioOutputDevices()}
                            disabled={!supportsAudioOutputSelection || isAudioOutputDevicesLoading || isSelectingAudioOutput}
                            className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${utilityGhostButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <RefreshCw size={13} className={isAudioOutputDevicesLoading ? 'animate-spin' : ''} />
                            <span>{t('options.audioOutputRefresh') || '刷新'}</span>
                        </button>
                    </div>

                    {!supportsAudioOutputSelection ? (
                        <div className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                            {t('options.audioOutputUnsupported') || '当前环境不支持切换播放设备。'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <CustomSelect
                                value={audioOutputDeviceId}
                                onChange={(val) => {
                                    void handleSelectAudioOutputDevice(val);
                                }}
                                options={[
                                    { value: '', label: t('options.audioOutputDefault') || '系统默认' },
                                    ...audioOutputDevices.map((device, index) => ({
                                        value: device.deviceId,
                                        label: device.label || `${t('options.audioOutputUnnamed') || '播放设备'} ${index + 1}`,
                                    })),
                                ]}
                                disabled={isAudioOutputDevicesLoading || isSelectingAudioOutput}
                                isDaylight={isDaylight}
                                theme={theme}
                            />

                            <div className={settingsDescClass} style={settingsDescStyle}>
                                {isSelectingAudioOutput
                                    ? (t('options.audioOutputSelecting') || '正在切换播放设备...')
                                    : isAudioOutputDevicesLoading
                                        ? (t('options.audioOutputLoading') || '正在读取播放设备...')
                                        : (t('options.audioOutputDefaultDesc') || '跟随操作系统当前默认输出设备。')}
                            </div>

                            {audioOutputDevicesError && (
                                <div className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                                    {audioOutputDevicesError}
                                </div>
                            )}

                            {!isAudioOutputDevicesLoading && audioOutputDevices.length === 0 && !audioOutputDevicesError && (
                                <div className={settingsFootnoteClass} style={settingsFootnoteStyle}>
                                    {t('options.audioOutputEmpty') || '没有检测到可切换的播放设备。'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PlaybackSettingsSubview;
