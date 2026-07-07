import type { MutableRefObject, RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { BeatMap } from '../../types/atmosphere';

// src/hooks/atmosphere/types.ts
// Shared atmosphere engine contracts.

export interface AtmosphereEngine {
    beatPulse: MotionValue<number>;
    cinemaScale: MotionValue<number>;
    atmosphereEnergy: MotionValue<number>;
    atmosphereGroove: MotionValue<number>;
    cameraPunch: MotionValue<number>;
    sceneParallaxX: MotionValue<number>;
    sceneParallaxY: MotionValue<number>;
    sceneRoll: MotionValue<number>;
    tick: (params: {
        analyser: AnalyserNode;
        audioElement: HTMLAudioElement;
        sampleRate: number;
        dt: number;
    }) => void;
    reset: (warmupUntil?: number) => void;
    beatMapRef: MutableRefObject<BeatMap | null>;
}

export type UseAtmosphereEngineParams = {
    enabled?: boolean;
    audioSrc: string | null;
    songKey: string | null;
    audioContextRef: RefObject<AudioContext | null>;
    durationSec?: number;
    contentType?: 'music' | 'podcast' | 'audiobook' | null;
    precomputedBeatMap?: BeatMap | null;
};

export type AtmosphereMotionValues = {
    beatPulse: MotionValue<number>;
    cinemaScale: MotionValue<number>;
    atmosphereEnergy: MotionValue<number>;
    atmosphereGroove: MotionValue<number>;
    cameraPunch: MotionValue<number>;
    sceneParallaxX: MotionValue<number>;
    sceneParallaxY: MotionValue<number>;
    sceneRoll: MotionValue<number>;
};

export type AtmosphereTickParams = {
    analyser: AnalyserNode;
    audioElement: HTMLAudioElement;
    sampleRate: number;
    dt: number;
};
