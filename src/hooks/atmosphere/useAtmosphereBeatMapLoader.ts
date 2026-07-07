import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { BeatMap } from '../../types/atmosphere';
import { analyzeBeatMapFromUrl } from '../../utils/atmosphere/beatMapAnalyzer';
import {
    applyCinemaProfileFromBeatMap,
    type CinemaTrackProfile,
} from '../../utils/atmosphere/moodProfile';

// src/hooks/atmosphere/useAtmosphereBeatMapLoader.ts
// Loads offline beat maps when the active audio source changes.

type UseAtmosphereBeatMapLoaderParams = {
    enabled: boolean;
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

    useEffect(() => {
        if (!enabled) {
            onReset();
            return;
        }

        onReset();
        analysisTokenRef.current += 1;
        const token = analysisTokenRef.current;

        if (!audioSrc || !songKey) {
            return;
        }

        if (longFormAudio) {
            if (precomputedBeatMap) {
                beatMapRef.current = precomputedBeatMap;
                applyCinemaProfileFromBeatMap(cinemaProfileRef.current, precomputedBeatMap);
                cinemaScale.set(cinemaProfileRef.current.scale);
                onBeatMapLoaded?.(precomputedBeatMap);
            }
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

        void run();

        return () => {
            cancelled = true;
        };
    }, [
        audioContextRef,
        audioSrc,
        beatMapRef,
        cinemaProfileRef,
        cinemaScale,
        enabled,
        longFormAudio,
        onReset,
        onBeatMapLoaded,
        precomputedBeatMap,
        songKey,
    ]);
};
