import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StageTrackPillMode } from '../../../utils/settings/stageTrackPillSettingsMath';

// src/components/app/overlays/NowPlayingToast.tsx
// Lyrics-page now-playing card: timed fade, always-on, or hidden. Next-up swaps in-place.

export type { StageTrackPillMode };

export interface NowPlayingToastSong {
    title: string;
    artist: string | null;
    coverUrl: string | null;
}

type NowPlayingToastProps = {
    song: NowPlayingToastSong;
    trackKey: string;
    isDaylight: boolean;
    mode?: StageTrackPillMode;
    timeoutSec?: number;
    nextUp?: NowPlayingToastSong | null;
    isNextUp?: boolean;
    onActivate?: () => void;
    activateLabel?: string;
};

const NowPlayingToast: React.FC<NowPlayingToastProps> = ({
    song,
    trackKey,
    isDaylight,
    mode = 'auto',
    timeoutSec = 10,
    nextUp = null,
    isNextUp = false,
    onActivate,
    activateLabel,
}) => {
    const { t } = useTranslation();
    const shown = isNextUp && nextUp ? nextUp : song;
    const label = isNextUp ? t('ui.stageTrackPillNext') : t('ui.stageTrackPillNow');
    const [brokenCoverUrl, setBrokenCoverUrl] = useState<string | null>(null);
    const coverSrc = shown.coverUrl && shown.coverUrl !== brokenCoverUrl ? shown.coverUrl : null;
    const [visible, setVisible] = useState(mode !== 'never');
    const holdOpen = mode === 'always' || isNextUp;
    const hideDelayMs = Math.max(3, Math.min(60, Math.round(timeoutSec))) * 1000;

    useEffect(() => {
        if (mode === 'never') {
            setVisible(false);
            return;
        }
        setVisible(true);
        if (holdOpen) return;
        const timer = window.setTimeout(() => setVisible(false), hideDelayMs);
        return () => window.clearTimeout(timer);
    }, [mode, hideDelayMs, trackKey, holdOpen]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pointer-events-none fixed bottom-8 left-6 z-40"
                >
                    <motion.button
                        data-toast-card=""
                        type="button"
                        layout="size"
                        onClick={onActivate}
                        disabled={!onActivate}
                        aria-label={onActivate ? activateLabel : undefined}
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={onActivate ? { opacity: 0.85 } : undefined}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={`relative flex min-w-[240px] items-center gap-3 overflow-hidden rounded-2xl border p-2 pr-4 text-left backdrop-blur-xl shadow-lg transition-colors ${
                            isDaylight ? 'border-black/10 bg-white/35 text-zinc-900' : 'border-white/10 bg-black/35 text-white'
                        } ${onActivate
                            ? `pointer-events-auto cursor-pointer ${isDaylight ? 'hover:bg-white/55' : 'hover:bg-black/55'}`
                            : ''}`}
                    >
                        <motion.span
                            aria-hidden
                            data-toast-sheen=""
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`absolute inset-x-0 top-0 h-[2px] origin-left ${
                                isDaylight
                                    ? 'bg-gradient-to-r from-transparent via-black/40 to-transparent'
                                    : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
                            }`}
                        />
                        <motion.div
                            layout
                            data-toast-cover={coverSrc ? 'image' : 'placeholder'}
                            className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                                isDaylight ? 'bg-zinc-200' : 'bg-zinc-800'
                            }`}
                        >
                            {coverSrc && (
                                <img
                                    src={coverSrc}
                                    alt=""
                                    onError={() => setBrokenCoverUrl(coverSrc)}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                            {!coverSrc && <Music size={18} className="opacity-50" />}
                        </motion.div>
                        <motion.div layout className="min-w-0 max-w-[200px] flex-1">
                            <div className="h-[10px] overflow-hidden text-[10px] font-medium uppercase tracking-[0.14em] opacity-55 leading-[10px]">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={label}
                                        className="block"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                    >
                                        {label}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                            <div className="truncate text-sm font-semibold leading-tight">{shown.title}</div>
                            <div className="truncate text-xs opacity-60">{shown.artist || t('ui.unknownArtist')}</div>
                        </motion.div>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NowPlayingToast;
