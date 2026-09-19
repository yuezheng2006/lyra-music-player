import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useLocalBeatAnalysisStore } from '../../stores/useLocalBeatAnalysisStore';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { analyzeBeatMapFromUrl } from '../../utils/atmosphere/beatMapAnalyzer';
import {
    getLocalBeatMap,
    setLocalBeatMap,
    setPreferredLocalBeatMode,
    type LocalBeatAnalysisMode,
} from '../../utils/atmosphere/localBeatMapCache';

// src/components/modal/LocalBeatAnalysisModal.tsx
// Confirm local-track beat analysis using the global cinema/pulse setting (no in-modal mode picker).

const LocalBeatAnalysisModal: React.FC = () => {
    const { t } = useTranslation();
    const isDaylight = useSettingsUiStore((s) => s.isDaylight);
    const analysisMode = useSettingsUiStore((s) => s.localBeatAnalysisMode);
    const {
        isOpen,
        prompt,
        analyzing,
        status,
        statusTone,
        setMode,
        setAnalyzing,
        setStatus,
        skipPrompt,
        publishHandoff,
    } = useLocalBeatAnalysisStore(useShallow((s) => ({
        isOpen: s.isOpen,
        prompt: s.prompt,
        analyzing: s.analyzing,
        status: s.status,
        statusTone: s.statusTone,
        setMode: s.setMode,
        setAnalyzing: s.setAnalyzing,
        setStatus: s.setStatus,
        skipPrompt: s.skipPrompt,
        publishHandoff: s.publishHandoff,
    })));

    const bgClass = isDaylight ? 'bg-white/95 border-black/10' : 'bg-zinc-900/95 border-white/10';
    const textPrimary = isDaylight ? 'text-zinc-900' : 'text-white';
    const textSecondary = isDaylight ? 'text-zinc-500' : 'text-zinc-400';
    const cancelBtn = isDaylight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200' : 'bg-white/5 hover:bg-white/10 text-white border-white/10';

    const mode: LocalBeatAnalysisMode = analysisMode === 'dj' ? 'dj' : 'mr';
    const cachedForMode = prompt ? getLocalBeatMap(prompt.persistKey, mode) : null;
    const modeLabel = mode === 'dj'
        ? t('localBeatAnalysis.pulseTitle', { defaultValue: '强节奏' })
        : t('localBeatAnalysis.cinemaTitle', { defaultValue: '电影视角' });

    const dismissForSession = useCallback(async (runSilent: boolean) => {
        if (!prompt || analyzing) return;
        const { persistKey, songKey, audioSrc } = prompt;
        skipPrompt(persistKey);
        if (!runSilent) return;
        try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const map = await analyzeBeatMapFromUrl(audioSrc, ctx, { mode });
            void ctx.close?.();
            if (!map) return;
            setLocalBeatMap(persistKey, mode, map);
            setPreferredLocalBeatMode(persistKey, mode);
            publishHandoff({ songKey, beatMap: map, mode });
        } catch {
            // Realtime atmosphere still works without offline map.
        }
    }, [analyzing, mode, prompt, publishHandoff, skipPrompt]);

    const startAnalysis = useCallback(async () => {
        if (!prompt || analyzing) return;
        setMode(mode);
        const cached = getLocalBeatMap(prompt.persistKey, mode);
        if (cached) {
            setPreferredLocalBeatMode(prompt.persistKey, mode);
            publishHandoff({ songKey: prompt.songKey, beatMap: cached, mode });
            useLocalBeatAnalysisStore.setState({ isOpen: false, analyzing: false });
            return;
        }

        setAnalyzing(true);
        setStatus(
            t('localBeatAnalysis.statusPreparing', {
                mode: modeLabel,
                defaultValue: '{{mode}} 分析准备中…',
            }),
            'warn',
        );
        try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) throw new Error('NO_AUDIO_CONTEXT');
            const ctx = new AudioCtx();
            const map = await analyzeBeatMapFromUrl(prompt.audioSrc, ctx, { mode });
            void ctx.close?.();
            if (!map) throw new Error('EMPTY_BEAT_MAP');
            setLocalBeatMap(prompt.persistKey, mode, map);
            setPreferredLocalBeatMode(prompt.persistKey, mode);
            publishHandoff({ songKey: prompt.songKey, beatMap: map, mode });
            setStatus(
                t('localBeatAnalysis.statusDone', {
                    mode: modeLabel,
                    count: map.visualBeatCount || map.cameraBeats.length,
                    defaultValue: '{{mode}} 分析完成：{{count}} 个主拍',
                }),
                'info',
            );
            setAnalyzing(false);
            window.setTimeout(() => {
                useLocalBeatAnalysisStore.setState({ isOpen: false });
            }, 700);
        } catch {
            setAnalyzing(false);
            setStatus(
                t('localBeatAnalysis.statusFail', { defaultValue: '分析失败，请稍后重试或在设置中切换分析模式' }),
                'fail',
            );
        }
    }, [analyzing, mode, modeLabel, prompt, publishHandoff, setAnalyzing, setMode, setStatus, t]);

    return (
        <AnimatePresence>
            {isOpen && prompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => { if (!analyzing) void dismissForSession(true); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        className={`w-full max-w-md rounded-2xl border shadow-2xl backdrop-blur-xl ${bgClass}`}
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="local-beat-analysis-title"
                    >
                        <div className="flex items-start justify-between gap-3 px-5 pt-5">
                            <div className="min-w-0">
                                <h2 id="local-beat-analysis-title" className={`text-lg font-semibold ${textPrimary}`}>
                                    {t('localBeatAnalysis.title', { defaultValue: '本地节奏分析' })}
                                </h2>
                                <p className={`mt-1 truncate text-sm ${textSecondary}`}>
                                    {prompt.trackTitle || t('localBeatAnalysis.untitled', { defaultValue: '本地歌曲' })}
                                </p>
                                <p className={`mt-1 text-xs ${textSecondary}`}>
                                    {t('localBeatAnalysis.subtitle', {
                                        mode: modeLabel,
                                        defaultValue: '将使用设置中的「{{mode}}」算法',
                                    })}
                                </p>
                            </div>
                            <button
                                type="button"
                                className={`rounded-full p-1.5 ${isDaylight ? 'hover:bg-zinc-200/60' : 'hover:bg-white/10'}`}
                                onClick={() => { if (!analyzing) void dismissForSession(true); }}
                                aria-label={t('common.close', { defaultValue: '关闭' })}
                                disabled={analyzing}
                            >
                                <X size={18} className={textSecondary} />
                            </button>
                        </div>

                        <p className={`mt-4 px-5 text-sm leading-relaxed ${textSecondary}`}>
                            {mode === 'dj'
                                ? t('localBeatAnalysis.pulseDesc', {
                                      defaultValue: '适合长混音或鼓点密集的本地音频，使用更稳定的低频锁拍驱动强节奏视觉。',
                                  })
                                : t('localBeatAnalysis.cinemaDesc', {
                                      defaultValue: '适合普通歌曲和日常播放，做综合节奏分析以驱动电影视角运镜与氛围。',
                                  })}
                        </p>

                        {status && (
                            <p className={`mt-2 px-5 text-xs ${
                                statusTone === 'fail' ? 'text-red-400'
                                    : statusTone === 'warn' ? (isDaylight ? 'text-amber-600' : 'text-amber-300')
                                        : textSecondary
                            }`}
                            >
                                {status}
                            </p>
                        )}

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 px-5 py-4">
                            <button
                                type="button"
                                disabled={analyzing}
                                className={`rounded-full border px-4 py-2 text-sm ${cancelBtn}`}
                                onClick={() => void dismissForSession(true)}
                            >
                                {t('localBeatAnalysis.later', { defaultValue: '暂不分析' })}
                            </button>
                            <button
                                type="button"
                                disabled={analyzing}
                                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-60"
                                onClick={() => void startAnalysis()}
                            >
                                {analyzing
                                    ? t('localBeatAnalysis.analyzing', { defaultValue: '分析中…' })
                                    : cachedForMode
                                        ? t('localBeatAnalysis.useCache', { defaultValue: '使用缓存' })
                                        : t('localBeatAnalysis.start', { defaultValue: '开始分析' })}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LocalBeatAnalysisModal;
