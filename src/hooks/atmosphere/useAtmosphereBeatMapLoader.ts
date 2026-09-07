import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { BeatMap } from '../../types/atmosphere';
import { analyzeBeatMapFromUrl } from '../../utils/atmosphere/beatMapAnalyzer';
import {
    applyCinemaProfileFromBeatMap,
    type CinemaTrackProfile,
} from '../../utils/atmosphere/moodProfile';
import { ATMOSPHERE_BEATMAP_DEFER_MS } from '../../utils/playback/playbackLoadPriorityMath';
import {
    getLocalBeatMap,
    isLocalBeatPromptSource,
    resolveLocalBeatPersistKey,
    setLocalBeatMap,
    setPreferredLocalBeatMode,
} from '../../utils/atmosphere/localBeatMapCache';
import { useLocalBeatAnalysisStore } from '../../stores/useLocalBeatAnalysisStore';
import { shouldPromptLocalBeatAnalysis } from '../../utils/atmosphere/localBeatAnalysisPolicy';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';

// src/hooks/atmosphere/useAtmosphereBeatMapLoader.ts
// Loads offline beat maps when the active audio source changes.

type UseAtmosphereBeatMapLoaderParams = {
    enabled: boolean;
    isPlaying?: boolean;
    audioSrc: string | null;
    songKey: string | null;
    trackTitle?: string | null;
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
    trackTitle = null,
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
    const promptedKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            onReset();
            sourceKeyRef.current = null;
            promptedKeyRef.current = null;
            return;
        }

        if (!audioSrc || !songKey) {
            onReset();
            sourceKeyRef.current = null;
            promptedKeyRef.current = null;
            return;
        }

        const sourceKey = `${songKey}|${audioSrc}`;
        // Reset only when the track/source changes — not on play/pause flips.
        if (sourceKeyRef.current !== sourceKey) {
            onReset();
            sourceKeyRef.current = sourceKey;
            analysisTokenRef.current += 1;
            promptedKeyRef.current = null;
        }
        const token = analysisTokenRef.current;

        const applyMap = (beatMap: BeatMap) => {
            if (token !== analysisTokenRef.current) return;
            beatMapRef.current = beatMap;
            applyCinemaProfileFromBeatMap(cinemaProfileRef.current, beatMap);
            cinemaScale.set(cinemaProfileRef.current.scale);
            onBeatMapLoaded?.(beatMap);
        };

        const handoff = useLocalBeatAnalysisStore.getState().takeHandoff(songKey);
        if (handoff?.beatMap) {
            applyMap(handoff.beatMap);
            return;
        }

        if (longFormAudio) {
            if (precomputedBeatMap) {
                applyMap(precomputedBeatMap);
            }
            return;
        }

        const persistKey = resolveLocalBeatPersistKey(songKey);
        const promptEligible = Boolean(persistKey) && isLocalBeatPromptSource(audioSrc);

        // Cached maps apply immediately so speaker-stage / cinema can enter on track change.
        if (promptEligible && persistKey) {
            const preferred = useSettingsUiStore.getState().localBeatAnalysisMode === 'dj' ? 'dj' : 'mr';
            const cached = getLocalBeatMap(persistKey, preferred)
                || getLocalBeatMap(persistKey, preferred === 'dj' ? 'mr' : 'dj');
            if (cached) {
                applyMap(cached);
                return;
            }
        }

        // Wait until playback has started so full-track decode cannot steal first buffer.
        if (!isPlaying) {
            return;
        }

        const audioContext = audioContextRef.current;
        if (!audioContext || (!/^https?:\/\//i.test(audioSrc) && !audioSrc.startsWith('blob:'))) {
            return;
        }

        if (promptEligible && persistKey) {
            const settings = useSettingsUiStore.getState();
            const preferred = settings.localBeatAnalysisMode === 'dj' ? 'dj' : 'mr';
            const localStore = useLocalBeatAnalysisStore.getState();
            const askBeforeAnalyze = shouldPromptLocalBeatAnalysis(settings.localBeatAnalysisPromptPolicy);
            if (!askBeforeAnalyze || localStore.isSkipped(persistKey)) {
                // Default auto / user dismissed — silent analysis with the global mode.
            } else if (promptedKeyRef.current !== persistKey) {
                promptedKeyRef.current = persistKey;
                localStore.openPrompt(
                    {
                        persistKey,
                        songKey,
                        audioSrc,
                        trackTitle: trackTitle || '',
                    },
                    preferred,
                );
                return;
            } else if (localStore.isOpen) {
                return;
            }
        }

        let cancelled = false;
        const run = async () => {
            const mode = useSettingsUiStore.getState().localBeatAnalysisMode === 'dj' ? 'dj' : 'mr';
            const beatMap = await analyzeBeatMapFromUrl(audioSrc, audioContext, promptEligible ? { mode } : undefined);
            if (cancelled || token !== analysisTokenRef.current || !beatMap) return;
            if (promptEligible && persistKey) {
                setLocalBeatMap(persistKey, mode, beatMap);
                setPreferredLocalBeatMode(persistKey, mode);
            }
            applyMap(beatMap);
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
        trackTitle,
    ]);

    // Apply modal analysis results without remounting the loader effect.
    useEffect(() => {
        if (!enabled || !songKey) return;
        return useLocalBeatAnalysisStore.subscribe((state) => {
            if (!state.handoff || state.handoff.songKey !== songKey) return;
            const handoff = useLocalBeatAnalysisStore.getState().takeHandoff(songKey);
            if (!handoff?.beatMap) return;
            beatMapRef.current = handoff.beatMap;
            applyCinemaProfileFromBeatMap(cinemaProfileRef.current, handoff.beatMap);
            cinemaScale.set(cinemaProfileRef.current.scale);
            onBeatMapLoaded?.(handoff.beatMap);
        });
    }, [
        beatMapRef,
        cinemaProfileRef,
        cinemaScale,
        enabled,
        onBeatMapLoaded,
        songKey,
    ]);
};
