import { useCallback, useMemo, useRef } from 'react';
import { useMotionValue } from 'framer-motion';
import {
    createCinemaTrackProfile,
    resetCinemaTrackProfile,
} from '../../utils/atmosphere/moodProfile';
import {
    createRealtimeBeatState,
    resetRealtimeBeatEngine,
} from '../../utils/atmosphere/realtimeBeatEngine';
import { shouldUsePodcastDjBeatMap } from '../../utils/atmosphere/podcastDjBeatMap';
import { useAtmosphereBeatMapStore } from '../../stores/useAtmosphereBeatMapStore';
import {
    resetAtmospherePresentationBeat,
    setAtmospherePresentationBeatPulse,
} from '../../utils/atmosphere/atmospherePresentationBus';
import { useAtmosphereBeatMapLoader } from './useAtmosphereBeatMapLoader';
import {
    createBeatCameraState,
    createBeatMapSchedulerState,
    resetBeatCameraState,
    resetBeatMapSchedulerState,
    syncBeatMapScheduler,
    useAtmosphereTick,
} from './useAtmosphereTick';
import type { AtmosphereEngine, UseAtmosphereEngineParams } from './types';

// src/hooks/atmosphere/useAtmosphereEngine.ts
// Coordinates realtime beat detection, mood profile, and optional offline beat map analysis.

export function useAtmosphereEngine({
    enabled = true,
    audioSrc,
    songKey,
    audioContextRef,
    durationSec = 0,
    contentType = null,
    precomputedBeatMap = null,
}: UseAtmosphereEngineParams): AtmosphereEngine {
    const beatPulse = useMotionValue(0);
    const cinemaScale = useMotionValue(0.82);
    const atmosphereEnergy = useMotionValue(0.42);
    const atmosphereGroove = useMotionValue(0.5);
    const cameraPunch = useMotionValue(0);
    const sceneParallaxX = useMotionValue(0);
    const sceneParallaxY = useMotionValue(0);
    const sceneRoll = useMotionValue(0);

    const beatMapRef = useRef<import('../../types/atmosphere').BeatMap | null>(null);
    const realtimeStateRef = useRef(createRealtimeBeatState());
    const cinemaProfileRef = useRef(createCinemaTrackProfile());
    const schedulerRef = useRef(createBeatMapSchedulerState());
    const cameraStateRef = useRef(createBeatCameraState());
    const longFormAudio = shouldUsePodcastDjBeatMap(durationSec, contentType);
    const preferScheduledBeatMap = longFormAudio && Boolean(precomputedBeatMap);

    const reset = useCallback((warmupUntil = 0) => {
        resetRealtimeBeatEngine(realtimeStateRef.current, warmupUntil);
        resetCinemaTrackProfile(cinemaProfileRef.current);
        resetBeatMapSchedulerState(schedulerRef.current);
        resetBeatCameraState(cameraStateRef.current);
        beatMapRef.current = null;
        useAtmosphereBeatMapStore.getState().setBeatMap(null);
        beatPulse.set(0);
        resetAtmospherePresentationBeat();
        setAtmospherePresentationBeatPulse(0);
        cinemaScale.set(0.82);
        atmosphereEnergy.set(0.42);
        atmosphereGroove.set(0.5);
        cameraPunch.set(0);
        sceneParallaxX.set(0);
        sceneParallaxY.set(0);
        sceneRoll.set(0);
    }, [
        atmosphereEnergy,
        atmosphereGroove,
        beatPulse,
        cameraPunch,
        cinemaScale,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
    ]);

    // Must stay referentially stable — loader effect deps include these callbacks.
    // An inline onReset re-created every render restarts analyzeBeatMapFromUrl in a loop
    // and freezes the player main thread.
    const onBeatMapLoaded = useCallback((beatMap: import('../../types/atmosphere').BeatMap) => {
        useAtmosphereBeatMapStore.getState().setBeatMap(beatMap);
        syncBeatMapScheduler(schedulerRef.current, beatMap, 0);
    }, []);

    useAtmosphereBeatMapLoader({
        enabled,
        audioSrc,
        songKey,
        audioContextRef,
        beatMapRef,
        cinemaProfileRef,
        cinemaScale,
        longFormAudio,
        precomputedBeatMap,
        onReset: reset,
        onBeatMapLoaded,
    });

    const tick = useAtmosphereTick({
        enabled,
        beatPulse,
        cinemaScale,
        atmosphereEnergy,
        atmosphereGroove,
        cameraPunch,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
        beatMapRef,
        realtimeStateRef,
        cinemaProfileRef,
        schedulerRef,
        cameraStateRef,
        preferScheduledBeatMap,
    });

    return useMemo(() => ({
        beatPulse,
        cinemaScale,
        atmosphereEnergy,
        atmosphereGroove,
        cameraPunch,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
        tick,
        reset,
        beatMapRef,
    }), [
        atmosphereEnergy,
        atmosphereGroove,
        beatPulse,
        cameraPunch,
        cinemaScale,
        reset,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
        tick,
    ]);
}

export { getAtmosphereSongKey } from './getAtmosphereSongKey';
export type { AtmosphereEngine, UseAtmosphereEngineParams } from './types';
