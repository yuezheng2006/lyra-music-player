import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { PlayerState } from '../types';
import type { LyricData, SongResult, Theme } from '../types';
import type { DesktopLyricsStatus } from '../types/desktopLyrics';
import { buildDesktopLyricsState } from '../utils/desktopLyrics/buildDesktopLyricsState';

// src/hooks/useElectronDesktopLyrics.ts
// Publishes lyric playback state to the Electron desktop lyrics overlay.

const DESKTOP_LYRICS_UPDATE_INTERVAL_MS = 250;

export interface UseElectronDesktopLyricsOptions {
    isElectronWindow: boolean;
    audioRef: RefObject<HTMLAudioElement | null>;
    lyrics: LyricData | null;
    currentLineIndex: number;
    lyricOffsetMs?: number;
    durationSec: number;
    playbackRate?: number;
    playerState: PlayerState;
    currentSong: SongResult | null;
    theme: Theme;
    lyricsFontScale: number;
    lyricsCustomFontFamily: string | null;
    motion?: {
        beatGlow?: number;
        beatPulse?: number;
        bass?: number;
        highBloom?: number;
    };
    beatMapKey?: string;
    beatMap?: unknown;
}

const emptyDesktopLyricsStatus = (): DesktopLyricsStatus => ({
    enabled: false,
    locked: true,
    y: 0.76,
    opacity: 0.92,
    bounds: null,
    middleClickPoller: false,
});

export const useElectronDesktopLyrics = ({
    isElectronWindow,
    audioRef,
    lyrics,
    currentLineIndex,
    lyricOffsetMs,
    durationSec,
    playbackRate,
    playerState,
    currentSong,
    theme,
    lyricsFontScale,
    lyricsCustomFontFamily,
    motion,
    beatMapKey,
    beatMap,
}: UseElectronDesktopLyricsOptions) => {
    const [desktopLyricsStatus, setDesktopLyricsStatus] = useState<DesktopLyricsStatus>(emptyDesktopLyricsStatus);
    const desktopLyricsEnabledRef = useRef(false);

    const getCurrentTimeSec = useCallback(() => {
        const audioTime = audioRef.current?.currentTime;
        return Number.isFinite(audioTime) ? audioTime : 0;
    }, [audioRef]);

    const buildPayload = useCallback((enabled = desktopLyricsEnabledRef.current) => buildDesktopLyricsState({
        enabled,
        lyrics,
        currentLineIndex,
        currentTimeSec: getCurrentTimeSec(),
        lyricOffsetMs,
        durationSec,
        playbackRate,
        playerState,
        fallbackTitle: currentSong?.name ?? null,
        theme,
        lyricsFontScale,
        lyricsCustomFontFamily,
        clickThrough: desktopLyricsStatus.locked,
        motion,
        beatMapKey,
        beatMap,
    }), [
        beatMap,
        beatMapKey,
        currentLineIndex,
        currentSong?.name,
        desktopLyricsStatus.locked,
        durationSec,
        getCurrentTimeSec,
        lyricOffsetMs,
        lyrics,
        lyricsCustomFontFamily,
        lyricsFontScale,
        motion,
        playbackRate,
        playerState,
        theme,
    ]);

    const publishDesktopLyricsUpdate = useCallback(() => {
        if (!desktopLyricsEnabledRef.current || !window.electron?.updateDesktopLyrics) {
            return;
        }
        void window.electron.updateDesktopLyrics(buildPayload(true)).catch((error) => {
            console.warn('[Electron] Failed to update desktop lyrics', error);
        });
    }, [buildPayload]);

    const setDesktopLyricsEnabled = useCallback(async (enabled: boolean) => {
        if (!isElectronWindow || !window.electron?.setDesktopLyricsEnabled) {
            return false;
        }
        const result = await window.electron.setDesktopLyricsEnabled(enabled, buildPayload(enabled));
        if (result && typeof result === 'object') {
            setDesktopLyricsStatus(result as DesktopLyricsStatus);
            desktopLyricsEnabledRef.current = !!(result as DesktopLyricsStatus).enabled;
        } else {
            desktopLyricsEnabledRef.current = enabled;
            setDesktopLyricsStatus((current) => ({ ...current, enabled }));
        }
        return desktopLyricsEnabledRef.current;
    }, [buildPayload, isElectronWindow]);

    const toggleDesktopLyrics = useCallback(async () => {
        return setDesktopLyricsEnabled(!desktopLyricsEnabledRef.current);
    }, [setDesktopLyricsEnabled]);

    const setDesktopLyricsLocked = useCallback(async (locked: boolean) => {
        if (!isElectronWindow || !window.electron?.setDesktopLyricsLockState) {
            return false;
        }
        await window.electron.setDesktopLyricsLockState(locked);
        setDesktopLyricsStatus((current) => ({ ...current, locked: !!locked }));
        publishDesktopLyricsUpdate();
        return locked;
    }, [isElectronWindow, publishDesktopLyricsUpdate]);

    useEffect(() => {
        if (!isElectronWindow) {
            setDesktopLyricsStatus(emptyDesktopLyricsStatus());
            desktopLyricsEnabledRef.current = false;
            return;
        }

        void window.electron?.getDesktopLyricsStatus?.().then((status) => {
            if (!status) return;
            const nextStatus = status as DesktopLyricsStatus;
            setDesktopLyricsStatus(nextStatus);
            desktopLyricsEnabledRef.current = !!nextStatus.enabled;
        }).catch((error) => {
            console.warn('[Electron] Failed to read desktop lyrics status', error);
        });

        const unsubscribeEnabled = window.electron?.onDesktopLyricsEnabledStateChanged?.((state) => {
            const enabled = !!state?.enabled;
            desktopLyricsEnabledRef.current = enabled;
            setDesktopLyricsStatus((current) => ({ ...current, enabled }));
        });

        const unsubscribeLock = window.electron?.onDesktopLyricsLockStateChanged?.((state) => {
            setDesktopLyricsStatus((current) => ({ ...current, locked: !!state?.locked }));
        });

        return () => {
            unsubscribeEnabled?.();
            unsubscribeLock?.();
        };
    }, [isElectronWindow]);

    useEffect(() => {
        if (!isElectronWindow || !desktopLyricsStatus.enabled) {
            return;
        }

        publishDesktopLyricsUpdate();
        const intervalId = window.setInterval(publishDesktopLyricsUpdate, DESKTOP_LYRICS_UPDATE_INTERVAL_MS);
        return () => window.clearInterval(intervalId);
    }, [
        currentLineIndex,
        currentSong?.name,
        desktopLyricsStatus.enabled,
        durationSec,
        isElectronWindow,
        lyricOffsetMs,
        lyrics,
        lyricsCustomFontFamily,
        lyricsFontScale,
        motion,
        playerState,
        publishDesktopLyricsUpdate,
        theme,
    ]);

    return {
        desktopLyricsStatus,
        setDesktopLyricsEnabled,
        toggleDesktopLyrics,
        setDesktopLyricsLocked,
    };
};
