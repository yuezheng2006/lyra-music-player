import { useEffect } from 'react';
import type { RefObject } from 'react';
import { PlayerState } from '../types';
import type { SongResult } from '../types';
import { publishMediaSessionTrack } from '../utils/mediaSessionSync';
import { resolveMediaSessionSeekTime } from '../utils/mediaSessionSeekMath';

// Bridges Lyra playback state to the browser Media Session API.
type UseMediaSessionBridgeOptions = {
    audioRef: RefObject<HTMLAudioElement | null>;
    currentSong: SongResult | null;
    cachedCoverUrl: string | null;
    playerState: PlayerState;
    isNowPlayingStageActive: boolean;
    t: (key: string) => string;
    mediaSessionPlayRef: RefObject<() => Promise<void>>;
    mediaSessionPauseRef: RefObject<() => void>;
    mediaSessionPrevRef: RefObject<() => void>;
    mediaSessionNextRef: RefObject<() => Promise<void> | void>;
    isNowPlayingControlDisabledRef: RefObject<boolean>;
};

export const useMediaSessionBridge = ({
    audioRef,
    currentSong,
    cachedCoverUrl,
    playerState,
    isNowPlayingStageActive,
    t,
    mediaSessionPlayRef,
    mediaSessionPauseRef,
    mediaSessionPrevRef,
    mediaSessionNextRef,
    isNowPlayingControlDisabledRef,
}: UseMediaSessionBridgeOptions) => {
    useEffect(() => {
        if (!('mediaSession' in navigator)) {
            return;
        }

        const mediaSession = navigator.mediaSession;
        const setActionHandlerSafely = (
            action: MediaSessionAction,
            handler: MediaSessionActionHandler | null
        ) => {
            try {
                mediaSession.setActionHandler(action, handler);
            } catch (e) {
                console.warn(`[MediaSession] Failed to bind ${action} handler`, e);
            }
        };

        setActionHandlerSafely('play', async () => {
            if (isNowPlayingControlDisabledRef.current || !audioRef.current) {
                return;
            }

            try {
                await mediaSessionPlayRef.current();
            } catch (e) {
                console.error('MediaSession play failed', e);
            }
        });
        setActionHandlerSafely('pause', () => {
            if (isNowPlayingControlDisabledRef.current || !audioRef.current) {
                return;
            }

            mediaSessionPauseRef.current();
        });
        setActionHandlerSafely('previoustrack', () => {
            if (isNowPlayingControlDisabledRef.current) {
                return;
            }
            mediaSessionPrevRef.current();
        });
        setActionHandlerSafely('nexttrack', () => {
            if (isNowPlayingControlDisabledRef.current) {
                return;
            }
            void mediaSessionNextRef.current();
        });
        const seekAudio = (
            details: MediaSessionActionDetails | null | undefined,
            direction: 'to' | 'backward' | 'forward',
        ) => {
            const audio = audioRef.current;
            if (isNowPlayingControlDisabledRef.current || !audio) return;
            const nextTime = resolveMediaSessionSeekTime(
                audio.currentTime,
                audio.duration,
                details,
                direction,
            );
            if (direction === 'to' && details?.fastSeek && typeof audio.fastSeek === 'function') {
                audio.fastSeek(nextTime);
                return;
            }
            audio.currentTime = nextTime;
        };
        setActionHandlerSafely('seekbackward', details => seekAudio(details, 'backward'));
        setActionHandlerSafely('seekforward', details => seekAudio(details, 'forward'));
        setActionHandlerSafely('seekto', details => seekAudio(details, 'to'));

        return () => {
            setActionHandlerSafely('play', null);
            setActionHandlerSafely('pause', null);
            setActionHandlerSafely('previoustrack', null);
            setActionHandlerSafely('nexttrack', null);
            setActionHandlerSafely('seekbackward', null);
            setActionHandlerSafely('seekforward', null);
            setActionHandlerSafely('seekto', null);
        };
    }, [audioRef, isNowPlayingControlDisabledRef, mediaSessionNextRef, mediaSessionPauseRef, mediaSessionPlayRef, mediaSessionPrevRef]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) {
            return;
        }

        const mediaSession = navigator.mediaSession;

        if (!currentSong) {
            try {
                mediaSession.metadata = null;
            } catch (e) {
                console.warn('[MediaSession] Failed to clear metadata', e);
            }
            return;
        }

        const artistName = currentSong.ar?.map(a => a.name).join(', ')
            || currentSong.artists?.map(a => a.name).join(', ')
            || t('ui.unknownArtist');
        const albumName = currentSong.al?.name || currentSong.album?.name || '';
        const cover = cachedCoverUrl || currentSong.al?.picUrl || currentSong.album?.picUrl || '';
        const audio = audioRef.current;

        try {
            if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
                publishMediaSessionTrack(mediaSession, audio, {
                    title: currentSong.name,
                    artist: artistName,
                    album: albumName,
                    artworkUrl: cover,
                });
            } else {
                mediaSession.metadata = new MediaMetadata({
                    title: currentSong.name,
                    artist: artistName,
                    album: albumName,
                    artwork: cover ? [{ src: cover, sizes: '1024x1024', type: 'image/jpeg' }] : [],
                });
            }
        } catch (e) {
            console.warn('[MediaSession] Failed to update metadata', e);
        }
    }, [audioRef, cachedCoverUrl, currentSong, t]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) {
            return;
        }

        try {
            navigator.mediaSession.playbackState = isNowPlayingStageActive
                ? 'none'
                : currentSong
                    ? (playerState === PlayerState.PLAYING ? 'playing' : 'paused')
                    : 'none';
        } catch (e) {
            console.warn('[MediaSession] Failed to update playback state', e);
        }
    }, [currentSong, isNowPlayingStageActive, playerState]);
};
