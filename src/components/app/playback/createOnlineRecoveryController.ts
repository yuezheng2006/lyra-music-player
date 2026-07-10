import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { loadOnlineSongAudioSource } from '../../../services/onlinePlayback';
import { markProviderAudioUnavailable } from '../../../services/musicProviders/sidecarProviderClient';
import { getSongMusicProviderId } from '../../../services/musicProviders/registry';
import type { SongResult } from '../../../types';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isStagePlaybackSong } from '../../../utils/appPlaybackGuards';

// src/components/app/playback/createOnlineRecoveryController.ts

const MAX_ONLINE_RECOVERY_ATTEMPTS_PER_SONG = 2;
const recoveryAttemptBySongId = new Map<number, number>();
const recoveryFailedSrcsBySongId = new Map<number, Set<string>>();

/** Clear per-song recovery guards when switching tracks. */
export const clearOnlinePlaybackRecoveryState = (songId?: number | null) => {
    if (typeof songId === 'number') {
        recoveryAttemptBySongId.delete(songId);
        recoveryFailedSrcsBySongId.delete(songId);
        return;
    }
    recoveryAttemptBySongId.clear();
    recoveryFailedSrcsBySongId.clear();
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

        // One recovery pass max — QQ open CDN links often 404 in a chain and must not loop.
        if (attempts >= MAX_ONLINE_RECOVERY_ATTEMPTS_PER_SONG) {
            markProviderAudioUnavailable(getSongMusicProviderId(song), song, audioQuality);
            return false;
        }

        if (normalizedFailedSrc && (
            lastAudioRecoverySourceRef.current === normalizedFailedSrc
            || failedSrcs.has(normalizedFailedSrc)
        )) {
            markProviderAudioUnavailable(getSongMusicProviderId(song), song, audioQuality);
            return false;
        }

        if (onlinePlaybackRecoveryRef.current) {
            return onlinePlaybackRecoveryRef.current;
        }

        const recoveryTask = (async () => {
            if (normalizedFailedSrc) {
                lastAudioRecoverySourceRef.current = normalizedFailedSrc;
                failedSrcs.add(normalizedFailedSrc);
                recoveryFailedSrcsBySongId.set(song.id, failedSrcs);
            }
            recoveryAttemptBySongId.set(song.id, attempts + 1);

            try {
                const audioResult = await loadOnlineSongAudioSource(song, audioQuality, null);
                if (currentSongRef.current !== song.id || !audioRef.current) {
                    return false;
                }

                if (audioResult.kind === 'unavailable') {
                    markProviderAudioUnavailable(getSongMusicProviderId(song), song, audioQuality);
                    return false;
                }

                const nextSrc = audioResult.audioSrc;
                if (
                    !nextSrc
                    || nextSrc === normalizedFailedSrc
                    || failedSrcs.has(nextSrc)
                ) {
                    markProviderAudioUnavailable(getSongMusicProviderId(song), song, audioQuality);
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
                setAudioSrc(audioResult.audioSrc);
                return true;
            } catch (error) {
                console.error('[App] Failed to recover online playback source', error);
                markProviderAudioUnavailable(getSongMusicProviderId(song), song, audioQuality);
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
