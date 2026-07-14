import { useEffect } from 'react';
import type { RefObject } from 'react';

// src/hooks/useBilibiliVideoSync.ts
// Keep the muted Bilibili video surface locked to the main audio clock.

type UseBilibiliVideoSyncParams = {
    enabled: boolean;
    videoSrc: string | null;
    audioRef: RefObject<HTMLAudioElement | null>;
    videoRef: RefObject<HTMLVideoElement | null>;
};

/** Larger drift tolerance avoids frequent seeks (seeks are expensive on Chromium). */
const DRIFT_SEC = 0.85;
const DRIFT_POLL_MS = 2000;

export function useBilibiliVideoSync({
    enabled,
    videoSrc,
    audioRef,
    videoRef,
}: UseBilibiliVideoSyncParams) {
    useEffect(() => {
        if (!enabled || !videoSrc) {
            return;
        }

        let cancelled = false;
        let attachRaf = 0;
        let driftTimer: ReturnType<typeof setInterval> | null = null;
        let detach: (() => void) | null = null;

        const syncTime = (audio: HTMLAudioElement, video: HTMLVideoElement) => {
            if (!Number.isFinite(audio.currentTime)) return;
            if (Math.abs(video.currentTime - audio.currentTime) > DRIFT_SEC) {
                try {
                    video.currentTime = audio.currentTime;
                } catch {
                    // Ignore seek races while the media is still loading.
                }
            }
        };

        const attach = () => {
            if (cancelled) return;
            const audio = audioRef.current;
            const video = videoRef.current;
            // Surface mounts after this effect; wait one frame for the video ref.
            if (!audio || !video) {
                attachRaf = requestAnimationFrame(attach);
                return;
            }

            video.muted = true;
            video.playsInline = true;

            const syncPlay = () => {
                syncTime(audio, video);
                if (video.paused) {
                    void video.play().catch(() => {});
                }
            };

            const syncPause = () => {
                if (!video.paused) {
                    video.pause();
                }
            };

            const onSeek = () => syncTime(audio, video);

            const onLoaded = () => {
                syncTime(audio, video);
                if (!audio.paused) {
                    syncPlay();
                }
            };

            audio.addEventListener('play', syncPlay);
            audio.addEventListener('playing', syncPlay);
            audio.addEventListener('pause', syncPause);
            audio.addEventListener('seeking', onSeek);
            audio.addEventListener('seeked', onSeek);
            video.addEventListener('loadeddata', onLoaded);

            // Slow drift poll only — avoid seeking on every audio timeupdate.
            driftTimer = setInterval(() => {
                if (!audio.paused) {
                    syncTime(audio, video);
                }
            }, DRIFT_POLL_MS);

            onLoaded();

            detach = () => {
                audio.removeEventListener('play', syncPlay);
                audio.removeEventListener('playing', syncPlay);
                audio.removeEventListener('pause', syncPause);
                audio.removeEventListener('seeking', onSeek);
                audio.removeEventListener('seeked', onSeek);
                video.removeEventListener('loadeddata', onLoaded);
                if (driftTimer) {
                    clearInterval(driftTimer);
                    driftTimer = null;
                }
                video.pause();
            };
        };

        attach();

        return () => {
            cancelled = true;
            cancelAnimationFrame(attachRaf);
            detach?.();
        };
    }, [audioRef, enabled, videoRef, videoSrc]);
}
