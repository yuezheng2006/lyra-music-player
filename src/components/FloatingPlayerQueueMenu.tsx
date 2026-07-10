import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../types';
import { getSongUnavailableTagText, isSongMarkedUnavailable } from '../services/netease';
import { useRequestedQueueStore } from '../stores/useRequestedQueueStore';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';

// src/components/FloatingPlayerQueueMenu.tsx
// Compact upward popover for 已点列表; surfaces auto-seed from the current playlist.

const ROW_HEIGHT_PX = 44;
const VISIBLE_ROWS = 6;

type FloatingPlayerQueueMenuProps = {
    playQueue: SongResult[];
    currentSongId?: number | null;
    onPlaySong: (song: SongResult, queue: SongResult[]) => void;
    isDaylight?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    disabled?: boolean;
    triggerClassName: string;
    queueLabel: string;
    /** Emphasize the trigger after auto-seed so the feature is noticeable. */
    highlightAutoSeed?: boolean;
};

const FloatingPlayerQueueMenu: React.FC<FloatingPlayerQueueMenuProps> = ({
    playQueue,
    currentSongId = null,
    onPlaySong,
    isDaylight = false,
    open,
    onOpenChange,
    disabled = false,
    triggerClassName,
    queueLabel,
    highlightAutoSeed = false,
}) => {
    const { t } = useTranslation();
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const autoSeedNotice = useRequestedQueueStore(state => state.autoSeedNotice);

    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };
        window.addEventListener('mousedown', handlePointerDown);
        return () => window.removeEventListener('mousedown', handlePointerDown);
    }, [onOpenChange, open]);

    useEffect(() => {
        if (!open || currentSongId == null || !listRef.current) return;
        const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest' });
    }, [currentSongId, open, playQueue.length]);

    return (
        <div className="relative shrink-0" ref={rootRef}>
            <button
                type="button"
                onClick={() => {
                    if (disabled) return;
                    onOpenChange(!open);
                }}
                disabled={disabled}
                className={`relative ${triggerClassName} ${
                    highlightAutoSeed
                        ? (isDaylight
                            ? 'ring-1 ring-black/20 bg-black/[0.08]'
                            : 'ring-1 ring-white/35 bg-white/[0.14]')
                        : ''
                }`}
                title={queueLabel}
                aria-label={queueLabel}
                aria-expanded={open}
                aria-haspopup="menu"
                data-testid="floating-player-queue-trigger"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <circle cx="4" cy="6" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="4" cy="12" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="4" cy="18" r="1.15" fill="currentColor" stroke="none" />
                    <path d="M9 6h11" />
                    <path d="M9 12h11" />
                    <path d="M9 18h11" />
                </svg>
                {highlightAutoSeed ? (
                    <span
                        className={`absolute -right-1 -top-1 inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-[3px] text-[8px] font-bold leading-none ${
                            isDaylight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-950'
                        }`}
                        data-testid="floating-player-queue-autoseed-badge"
                    >
                        {t('queue.autoSeedBadge')}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div
                    role="menu"
                    className={`absolute right-0 z-30 w-[min(320px,72vw)] overflow-hidden rounded-[14px] border p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl ${
                        isDaylight
                            ? 'border-black/10 bg-white/95 text-black'
                            : 'border-white/10 bg-black/82 text-white'
                    }`}
                    style={{ bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)` }}
                    data-testid="floating-player-queue-menu"
                >
                    <div className={`mb-1 px-2 py-1 text-[11px] font-semibold ${isDaylight ? 'text-black/50' : 'text-white/55'}`}>
                        {t('queue.title')} ({playQueue.length})
                    </div>
                    {autoSeedNotice ? (
                        <div
                            className={`mb-1.5 rounded-[10px] px-2.5 py-2 text-[11px] leading-snug ${
                                isDaylight
                                    ? 'bg-black/[0.05] text-black/65'
                                    : 'bg-white/[0.08] text-white/72'
                            }`}
                            data-testid="floating-player-queue-autoseed-banner"
                        >
                            {t('queue.autoSeedBanner')}
                        </div>
                    ) : null}
                    {playQueue.length === 0 ? (
                        <div className={`px-2 py-6 text-center text-[12px] ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                            {t('queue.empty')}
                        </div>
                    ) : (
                        <div
                            ref={listRef}
                            className="custom-scrollbar overflow-y-auto"
                            style={{ maxHeight: ROW_HEIGHT_PX * VISIBLE_ROWS }}
                        >
                            {playQueue.map((song) => {
                                const isActive = currentSongId === song.id;
                                const isUnavailable = isSongMarkedUnavailable(song);
                                const unavailableTagText = getSongUnavailableTagText(song, t('status.songUnavailableTag'));
                                const artists = song.ar?.map(artist => artist.name).filter(Boolean).join(', ')
                                    || song.artists?.map(artist => artist.name).filter(Boolean).join(', ')
                                    || '';

                                return (
                                    <button
                                        key={song.id}
                                        type="button"
                                        role="menuitem"
                                        data-active={isActive ? 'true' : 'false'}
                                        onClick={() => {
                                            onPlaySong(song, playQueue);
                                            onOpenChange(false);
                                        }}
                                        className={`flex w-full items-center gap-2.5 rounded-[9px] px-2 py-2 text-left transition-colors ${
                                            isActive
                                                ? (isDaylight ? 'bg-black/10 text-black' : 'bg-white/15 text-white')
                                                : (isDaylight ? 'text-black/75 hover:bg-black/5' : 'text-white/78 hover:bg-white/10 hover:text-white')
                                        } ${isUnavailable ? 'opacity-55' : ''}`}
                                        style={{ minHeight: ROW_HEIGHT_PX }}
                                    >
                                        <span
                                            className={`h-5 w-1 shrink-0 rounded-full ${
                                                isActive
                                                    ? (isDaylight ? 'bg-zinc-700' : 'bg-white')
                                                    : 'bg-transparent'
                                            }`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[12px] font-semibold leading-snug">
                                                {song.name}
                                                {isUnavailable ? (
                                                    <span className={`ml-1.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium align-middle ${
                                                        isDaylight
                                                            ? 'border-black/8 bg-black/[0.04] text-zinc-600'
                                                            : 'border-white/10 bg-white/[0.05] text-zinc-300'
                                                    }`}>
                                                        {unavailableTagText}
                                                    </span>
                                                ) : null}
                                            </span>
                                            {artists ? (
                                                <span className={`mt-0.5 block truncate text-[10px] ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                                                    {artists}
                                                </span>
                                            ) : null}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default FloatingPlayerQueueMenu;
