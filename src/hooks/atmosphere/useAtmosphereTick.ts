import { useCallback, useRef, type MutableRefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { BeatMap } from '../../types/atmosphere';
import {
    createBeatCameraState,
    resetBeatCameraState,
    scheduleBeatCamera,
    updateBeatCamera,
    type BeatCameraState,
} from '../../utils/atmosphere/beatCameraEnvelope';
import {
    createBeatMapSchedulerState,
    resetBeatMapSchedulerState,
    syncBeatMapScheduler,
    tickBeatMapScheduler,
    type BeatMapSchedulerState,
} from '../../utils/atmosphere/beatMapScheduler';
import {
    buildMoodProfile,
    updateCinemaTrackProfile,
    type CinemaTrackProfile,
} from '../../utils/atmosphere/moodProfile';
import { follow } from '../../utils/atmosphere/math';
import {
    RHYTHM_SMOOTH_ATTACK_TAU,
    RHYTHM_SMOOTH_RELEASE_TAU,
} from '../../utils/atmosphere/rhythmPresentation';
import {
    tickRealtimeBeatEngine,
    type RealtimeBeatState,
} from '../../utils/atmosphere/realtimeBeatEngine';
import type { AtmosphereTickParams } from './types';

// src/hooks/atmosphere/useAtmosphereTick.ts
// Runs one atmosphere analysis frame from analyser data.

type UseAtmosphereTickParams = {
    enabled: boolean;
    beatPulse: MotionValue<number>;
    cinemaScale: MotionValue<number>;
    atmosphereEnergy: MotionValue<number>;
    atmosphereGroove: MotionValue<number>;
    cameraPunch: MotionValue<number>;
    sceneParallaxX: MotionValue<number>;
    sceneParallaxY: MotionValue<number>;
    sceneRoll: MotionValue<number>;
    beatMapRef: MutableRefObject<BeatMap | null>;
    realtimeStateRef: MutableRefObject<RealtimeBeatState>;
    cinemaProfileRef: MutableRefObject<CinemaTrackProfile>;
    schedulerRef: MutableRefObject<BeatMapSchedulerState>;
    cameraStateRef: MutableRefObject<BeatCameraState>;
    preferScheduledBeatMap: boolean;
};

export const useAtmosphereTick = ({
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
}: UseAtmosphereTickParams) => {
    const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const timeDomainDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const presentationPulseRef = useRef(0);

    return useCallback(({ analyser, audioElement, sampleRate, dt }: AtmosphereTickParams) => {
        if (!enabled) return;

        const bufferLength = analyser.frequencyBinCount;
        if (!frequencyDataRef.current || frequencyDataRef.current.length !== bufferLength) {
            frequencyDataRef.current = new Uint8Array(bufferLength);
        }
        if (!timeDomainDataRef.current || timeDomainDataRef.current.length !== analyser.fftSize) {
            timeDomainDataRef.current = new Uint8Array(analyser.fftSize);
        }

        analyser.getByteFrequencyData(frequencyDataRef.current);
        analyser.getByteTimeDomainData(timeDomainDataRef.current);

        const currentTimeSec = audioElement.currentTime || 0;
        const paused = audioElement.paused;
        const result = tickRealtimeBeatEngine(
            realtimeStateRef.current,
            frequencyDataRef.current,
            timeDomainDataRef.current,
            sampleRate,
            analyser.fftSize,
            currentTimeSec,
            dt,
        );

        updateCinemaTrackProfile(cinemaProfileRef.current, result.sample);
        const mood = buildMoodProfile(
            cinemaProfileRef.current,
            result.sample,
            beatMapRef.current,
        );

        const profileScale = cinemaProfileRef.current.scale;
        const scheduledPulse = tickBeatMapScheduler(
            schedulerRef.current,
            beatMapRef.current,
            currentTimeSec,
            dt,
            profileScale,
            cameraStateRef.current,
        );

        if (!preferScheduledBeatMap && result.hit) {
            scheduleBeatCamera(
                cameraStateRef.current,
                {
                    time: currentTimeSec,
                    strength: result.pulse,
                    confidence: result.score,
                    impact: result.pulse,
                    low: result.sample.low,
                    body: result.sample.body,
                    snap: result.sample.melody * 0.4,
                },
                profileScale,
            );
        }

        const cameraFrame = updateBeatCamera(
            cameraStateRef.current,
            currentTimeSec,
            dt,
            paused,
        );

        const combinedPulse = preferScheduledBeatMap
            ? scheduledPulse
            : Math.max(result.pulse, scheduledPulse * 0.92);
        presentationPulseRef.current = follow(
            presentationPulseRef.current,
            combinedPulse,
            dt,
            RHYTHM_SMOOTH_ATTACK_TAU,
            RHYTHM_SMOOTH_RELEASE_TAU,
        );
        const punchedScale = profileScale * (1 + cameraFrame.radiusKick * 0.18);

        beatPulse.set(presentationPulseRef.current);
        cinemaScale.set(punchedScale);
        atmosphereEnergy.set(mood.energy);
        atmosphereGroove.set(mood.groove);
        cameraPunch.set(cameraFrame.punch);
        sceneParallaxX.set(cameraFrame.phiKick * 120);
        sceneParallaxY.set(cameraFrame.radiusKick * 90);
        sceneRoll.set(cameraFrame.rollKick);
    }, [
        atmosphereEnergy,
        atmosphereGroove,
        beatMapRef,
        beatPulse,
        cameraPunch,
        cameraStateRef,
        cinemaProfileRef,
        cinemaScale,
        enabled,
        preferScheduledBeatMap,
        realtimeStateRef,
        sceneParallaxX,
        sceneParallaxY,
        sceneRoll,
        schedulerRef,
    ]);
};

export {
    createBeatCameraState,
    createBeatMapSchedulerState,
    resetBeatCameraState,
    resetBeatMapSchedulerState,
    syncBeatMapScheduler,
};
