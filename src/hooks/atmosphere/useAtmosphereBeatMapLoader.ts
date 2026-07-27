import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { BeatMap } from '../../types/atmosphere';
import { analyzeBeatMapFromUrl } from '../../utils/atmosphere/beatMapAnalyzer';
import {
    applyCinemaProfileFromBeatMap,
    type CinemaTrackProfile,
} from '../../utils/atmosphere/moodProfile';
import { ATMOSPHERE_BEATMAP_DEFER_MS } from '../../utils/playback/playbackLoadPriorityMath';

// src/hooks/atmosphere/useAtmosphereBeatMapLoader.ts
// Loads offline beat maps when the active audio source changes.

type UseAtmosphereBeatMapLoaderParams = {
    enabled: boolean;
    isPlaying?: boolean;
    audioSrc: string | null;
    songKey: string | null;
    audioContextRef: RefObject<AudioContext | null>;
    beatMapRef: MutableRefObject<BeatMap | null>;
    cinemaProfileRef: MutableRefObject<CinemaTrackProfile>;
    cinemaScale: MotionValue<number>;
    longFormAudio: boolean;
    precomputedBeatMap: BeatMap | null;
    onReset: () => void;
    onBeatMapLoaded?: (beatMap: BeatMap) => void;
};

export const useAtmosphereBeatMapLoader = ({
    enabled,
    isPlaying = false,
    audioSrc,
    songKey,
    audioContextRef,
    beatMapRef,
    cinemaProfileRef,
    cinemaScale,
    longFormAudio,
    precomputedBeatMap,
    onReset,
    onBeatMapLoaded,
}: UseAtmosphereBeatMapLoaderParams) => {
    const analysisTokenRef = useRef(0);
    const sourceKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            onReset();
            sourceKeyRef.current = null;
            return;
        }

        if (!audioSrc || !songKey) {
            onReset();
            sourceKeyRef.current = null;
            return;
        }

        const sourceKey = `${songKey}|${audioSrc}`;
        // Reset only when the track/source changes — not on play/pause flips.
        if (sourceKeyRef.current !== sourceKey) {
            onReset();
            sourceKeyRef.current = sourceKey;
            analysisTokenRef.current += 1;
        }
        const token = analysisTokenRef.current;

        if (longFormAudio) {
            if (precomputedBeatMap) {
                beatMapRef.current = precomputedBeatMap;
                applyCinemaProfileFromBeatMap(cinemaProfileRef.current, precomputedBeatMap);
                cinemaScale.set(cinemaProfileRef.current.scale);
                onBeatMapLoaded?.(precomputedBeatMap);
            }
            return;
        }

        // Wait until playback has started so full-track decode cannot steal first buffer.
        if (!isPlaying) {
            return;
        }

        const audioContext = audioContextRef.current;
        if (!audioContext || (!/^https?:\/\//i.test(audioSrc) && !audioSrc.startsWith('blob:'))) {
            return;
        }

        let cancelled = false;
        const run = async () => {
            const beatMap = await analyzeBeatMapFromUrl(audioSrc, audioContext);
            if (cancelled || token !== analysisTokenRef.current || !beatMap) return;
            beatMapRef.current = beatMap;
            applyCinemaProfileFromBeatMap(cinemaProfileRef.current, beatMap);
            cinemaScale.set(cinemaProfileRef.current.scale);
            onBeatMapLoaded?.(beatMap);
        };

        const timer = window.setTimeout(() => {
            void run();
        }, ATMOSPHERE_BEATMAP_DEFER_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [
        audioContextRef,
        audioSrc,
        beatMapRef,
        cinemaProfileRef,
        cinemaScale,
        enabled,
        isPlaying,
        longFormAudio,
        onReset,
        onBeatMapLoaded,
        precomputedBeatMap,
        songKey,
    ]);
};
