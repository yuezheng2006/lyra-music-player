import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../types';
import { getSongUnavailableTagText, isSongMarkedUnavailable } from '../services/netease';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import { createCoverUrlResolver } from './app/playback/createCoverUrlResolver';
import LazyCoverImage from './shared/LazyCoverImage';

// src/components/FloatingPlayerQueueMenu.tsx
// Compact upward popover for the active playback playlist.

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
}) => {
    const { t } = useTranslation();
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [pendingSongId, setPendingSongId] = React.useState<number | null>(null);

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
        if (!open || (currentSongId == null && pendingSongId == null) || !listRef.current) return;
        const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest' });
    }, [currentSongId, open, pendingSongId, playQueue.length]);

    return (
        <div className="relative shrink-0" ref={rootRef}>
            <button
                type="button"
                onClick={() => {
                    if (disabled) return;
                    onOpenChange(!open);
                }}
                disabled={disabled}
                className={triggerClassName}
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
            </button>

            {open ? (
                <div
                    role="menu"
                    className="absolute right-0 z-30 w-[min(320px,72vw)] overflow-hidden rounded-[14px] border p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl text-[color:var(--shell-text)] transition-colors duration-300"
                    style={{
                        bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)`,
                        backgroundColor: 'var(--shell-popover)',
                        borderColor: 'var(--shell-border)',
                    }}
                    data-testid="floating-player-queue-menu"
                >
                    <div className={`mb-1 px-2 py-1 text-[11px] font-semibold ${isDaylight ? 'text-black/50' : 'text-white/55'}`}>
                        {t('queue.title')} ({playQueue.length})
                    </div>
                    {playQueue.length === 0 ? (
                        <div className={`px-2 py-6 text-center text-[12px] ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                            {t('queue.emptyHint')}
                        </div>
                    ) : (
                        <div
                            ref={listRef}
                            className="custom-scrollbar overflow-y-auto"
                            style={{ maxHeight: ROW_HEIGHT_PX * VISIBLE_ROWS }}
                        >
                            {playQueue.map((song) => {
                                const isActive = (pendingSongId ?? currentSongId) === song.id;
                                const isUnavailable = isSongMarkedUnavailable(song);
                                const unavailableTagText = getSongUnavailableTagText(song, t('status.songUnavailableTag'));
                                const coverUrl = createCoverUrlResolver(null, song)();
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
                                            setPendingSongId(song.id);
                                            void Promise.resolve(onPlaySong(song, playQueue)).finally(() => {
                                                setPendingSongId(currentId => currentId === song.id ? null : currentId);
                                            });
                                            onOpenChange(false);
                                        }}
                                        className={`flex w-full items-center gap-2.5 rounded-[9px] px-2 py-2 text-left transition-colors ${
                                            isActive
                                                ? (isDaylight ? 'bg-black/10 text-black' : 'bg-white/15 text-white')
                                                : (isDaylight ? 'text-black/75 hover:bg-black/5' : 'text-white/78 hover:bg-white/10 hover:text-white')
                                        } ${isUnavailable ? 'opacity-55' : ''}`}
                                        style={{ minHeight: ROW_HEIGHT_PX }}
                                    >
                                        <LazyCoverImage
                                            src={coverUrl}
                                            placeholderLabel={song.name}
                                            placeholderArtist={song.ar?.map(a => a.name).join(', ')}
                                            sizePx={56}
                                            className="h-7 w-7 shrink-0 rounded object-cover"
                                        />
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
