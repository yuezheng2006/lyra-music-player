import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { loadOnlineSongAudioSource } from '../../../services/onlinePlayback';
import {
    clearProviderAudioUnavailable,
    markProviderAudioUnavailable,
} from '../../../services/musicProviders/sidecarProviderClient';
import { getSongMusicProviderId } from '../../../services/musicProviders/registry';
import type { SongResult } from '../../../types';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isStagePlaybackSong } from '../../../utils/appPlaybackGuards';
import { normalizePlaybackVideoSrc } from '../../../utils/playback/resolveVideoPlaybackStage';
import { startTelemetrySpan, trackTelemetry } from '../../../utils/telemetry/trackTelemetry';

// src/components/app/playback/createOnlineRecoveryController.ts

export const MAX_ONLINE_RECOVERY_ATTEMPTS_PER_SONG = 3;
const recoveryAttemptBySongId = new Map<number, number>();
const recoveryFailedSrcsBySongId = new Map<number, Set<string>>();
const terminalRecoveryTelemetryBySongId = new Set<number>();

/** True once a song's refresh budget is exhausted, until it is played afresh. */
export const isOnlinePlaybackRecoveryExhausted = (songId: number | null | undefined): boolean => (
    typeof songId === 'number'
    && (recoveryAttemptBySongId.get(songId) ?? 0) >= MAX_ONLINE_RECOVERY_ATTEMPTS_PER_SONG
);

/** Clear per-song recovery guards when switching tracks. */
export const clearOnlinePlaybackRecoveryState = (songId?: number | null) => {
    if (typeof songId === 'number') {
        recoveryAttemptBySongId.delete(songId);
        recoveryFailedSrcsBySongId.delete(songId);
        terminalRecoveryTelemetryBySongId.delete(songId);
        return;
    }
    recoveryAttemptBySongId.clear();
    recoveryFailedSrcsBySongId.clear();
    terminalRecoveryTelemetryBySongId.clear();
};

type RecoveryControllerParams = {
    audioQuality: string;
    currentSong: SongResult | null;
    audioSrc: string | null;
    audioRef: RefObject<HTMLAudioElement | null>;
    currentSongRef: MutableRefObject<number | null>;
    blobUrlRef: MutableRefObject<string | null>;
    shouldAutoPlayRef: MutableRefObject<boolean>;
    pendingResumeTimeRef: MutableRefObject<number | null>;
    onlinePlaybackRecoveryRef: MutableRefObject<Promise<boolean> | null>;
    lastAudioRecoverySourceRef: MutableRefObject<string | null>;
    currentOnlineAudioUrlFetchedAtRef: MutableRefObject<number | null>;
    setAudioSrc: Dispatch<SetStateAction<string | null>>;
    setVideoSrc?: Dispatch<SetStateAction<string | null>>;
    /** Remount <audio> so a poisoned element can load again after Format error. */
    remountAudioElement?: () => void;
    onlineAudioUrlTtlMs: number;
    onlineAudioUrlRefreshBufferMs: number;
};

// Creates online-stream refresh and recovery helpers without tying them to a React hook.
export const createOnlineRecoveryController = ({
    audioQuality,
    currentSong,
    audioSrc,
    audioRef,
    currentSongRef,
    blobUrlRef,
    shouldAutoPlayRef,
    pendingResumeTimeRef,
    onlinePlaybackRecoveryRef,
    lastAudioRecoverySourceRef,
    currentOnlineAudioUrlFetchedAtRef,
    setAudioSrc,
    setVideoSrc,
    remountAudioElement,
    onlineAudioUrlTtlMs,
    onlineAudioUrlRefreshBufferMs,
}: RecoveryControllerParams) => {
    const shouldRefreshCurrentOnlineAudioSource = () => {
        if (!currentSong || isLocalPlaybackSong(currentSong) || isNavidromePlaybackSong(currentSong) || isStagePlaybackSong(currentSong)) {
            return false;
        }

        if (!audioSrc || audioSrc.startsWith('blob:')) {
            return false;
        }

        const fetchedAt = currentOnlineAudioUrlFetchedAtRef.current;
        if (!fetchedAt) {
            return false;
        }

        return Date.now() - fetchedAt >= onlineAudioUrlTtlMs - onlineAudioUrlRefreshBufferMs;
    };

    const recoverOnlinePlaybackSource = async ({
        failedSrc,
        resumeAt,
        autoplay,
    }: {
        failedSrc?: string | null;
        resumeAt?: number;
        autoplay: boolean;
    }): Promise<boolean> => {
        const song = currentSong;
        const audioElement = audioRef.current;

        if (!song || !audioElement || isLocalPlaybackSong(song) || isNavidromePlaybackSong(song) || isStagePlaybackSong(song)) {
            return false;
        }

        const normalizedFailedSrc = failedSrc || audioElement.currentSrc || audioSrc || null;
        const attempts = recoveryAttemptBySongId.get(song.id) || 0;
        const failedSrcs = recoveryFailedSrcsBySongId.get(song.id) || new Set<string>();

        const providerId = getSongMusicProviderId(song);

        // Cap retries — QQ open CDN 404 chains must not loop forever.
        if (isOnlinePlaybackRecoveryExhausted(song.id)) {
            // A terminal source failure must also disarm the canplay/loadeddata
            // autoplay path; otherwise each media event retries play() forever.
            shouldAutoPlayRef.current = false;
            pendingResumeTimeRef.current = null;
            if (!terminalRecoveryTelemetryBySongId.has(song.id)) {
                terminalRecoveryTelemetryBySongId.add(song.id);
                trackTelemetry('audio.resolve', {
                    level: 'error',
                    data: { ok: false, reason: 'max-attempts', provider: providerId, songId: song.id, attempts },
                });
            }
            markProviderAudioUnavailable(providerId, song, audioQuality);
            return false;
        }

        // Same failedSrc may retry after a same-URL remount heal — expired Douyin links need a new signature.
        if (onlinePlaybackRecoveryRef.current) {
            return onlinePlaybackRecoveryRef.current;
        }

        const resolveSpan = startTelemetrySpan('audio.resolve', {
            provider: providerId,
            songId: song.id,
            attempt: attempts + 1,
            phase: 'recover',
        });

        const recoveryTask = (async () => {
            if (normalizedFailedSrc) {
                lastAudioRecoverySourceRef.current = normalizedFailedSrc;
                failedSrcs.add(normalizedFailedSrc);
                recoveryFailedSrcsBySongId.set(song.id, failedSrcs);
            }
            recoveryAttemptBySongId.set(song.id, attempts + 1);

            try {
                clearProviderAudioUnavailable(providerId, song, audioQuality);

                let audioResult = await loadOnlineSongAudioSource(song, audioQuality, null, {
                    forceRefresh: true,
                });

                // Restore often shares an in-flight song-url lookup; force a second mint if unchanged.
                if (
                    audioResult.kind === 'ok'
                    && normalizedFailedSrc
                    && audioResult.audioSrc === normalizedFailedSrc
                ) {
                    audioResult = await loadOnlineSongAudioSource(song, audioQuality, null, {
                        forceRefresh: true,
                    });
                }

                if (currentSongRef.current !== song.id || !audioRef.current) {
                    return false;
                }

                if (audioResult.kind === 'unavailable') {
                    resolveSpan.end({ level: 'error', data: { ok: false, reason: 'unavailable' } });
                    markProviderAudioUnavailable(providerId, song, audioQuality);
                    return false;
                }

                const nextSrc = audioResult.audioSrc;
                if (!nextSrc) {
                    resolveSpan.end({ level: 'error', data: { ok: false, reason: 'empty-src' } });
                    markProviderAudioUnavailable(providerId, song, audioQuality);
                    return false;
                }

                // Same CDN URL often still plays after remount — HTMLAudioElement can stay
                // stuck on MEDIA_ERR_SRC_NOT_SUPPORTED ("Format error") even when the URL is fine.
                const isSameSrcHeal = Boolean(normalizedFailedSrc && nextSrc === normalizedFailedSrc);
                if (!isSameSrcHeal && failedSrcs.has(nextSrc)) {
                    resolveSpan.end({ level: 'error', data: { ok: false, reason: 'failed-src-loop' } });
                    markProviderAudioUnavailable(providerId, song, audioQuality);
                    return false;
                }

                if (blobUrlRef.current && blobUrlRef.current !== audioResult.blobUrl) {
                    URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = null;
                }

                if (audioResult.blobUrl) {
                    blobUrlRef.current = audioResult.blobUrl;
                }

                pendingResumeTimeRef.current = Math.max(0, resumeAt ?? audioRef.current.currentTime ?? 0);
                shouldAutoPlayRef.current = autoplay;
                currentOnlineAudioUrlFetchedAtRef.current = audioResult.audioSrc.startsWith('blob:')
                    ? null
                    : Date.now();
                // Always remount: a poisoned <audio> may not load a new src either.
                remountAudioElement?.();
                setAudioSrc(audioResult.audioSrc);
                setVideoSrc?.(normalizePlaybackVideoSrc(audioResult.videoSrc));
                trackTelemetry('audio.src_set', {
                    data: { provider: providerId, songId: song.id, phase: 'recover', sameSrcHeal: isSameSrcHeal },
                });
                resolveSpan.end({ data: { ok: true, sameSrcHeal: isSameSrcHeal } });
                return true;
            } catch (error) {
                console.error('[App] Failed to recover online playback source', error);
                resolveSpan.end({
                    level: 'error',
                    data: {
                        ok: false,
                        reason: 'exception',
                        name: error instanceof Error ? error.name : 'unknown',
                    },
                });
                markProviderAudioUnavailable(providerId, song, audioQuality);
                return false;
            } finally {
                onlinePlaybackRecoveryRef.current = null;
            }
        })();

        onlinePlaybackRecoveryRef.current = recoveryTask;
        return recoveryTask;
    };

    return {
        shouldRefreshCurrentOnlineAudioSource,
        recoverOnlinePlaybackSource,
    };
};
