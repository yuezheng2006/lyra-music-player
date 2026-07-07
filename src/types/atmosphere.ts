// src/types/atmosphere.ts
// Shared atmosphere / beat-sync contracts for visualizer background layers.

export type BeatCombo = 'downbeat' | 'push' | 'drop' | 'rebound' | 'accent';

export interface BeatEvent {
    time: number;
    strength: number;
    confidence: number;
    primary?: boolean;
    camera?: boolean;
    pulse?: boolean;
    tone?: 'deep' | 'body' | 'snap' | 'mixed' | 'grid';
    low?: number;
    body?: number;
    snap?: number;
    impact?: number;
    combo?: BeatCombo;
    index?: number;
}

export interface BeatMap {
    kicks: number[];
    beats: BeatEvent[];
    pulseBeats: BeatEvent[];
    cameraBeats: BeatEvent[];
    duration: number;
    visualBeatCount: number;
    tempoSource: string;
    analyzedAt: number;
    gridStep?: number;
}

export interface MoodProfile {
    energy: number;
    aggression: number;
    groove: number;
    space: number;
    brightness: number;
    warmth: number;
    stability: number;
}

export interface AtmosphereSample {
    energy: number;
    low: number;
    body: number;
    vocal: number;
    melody: number;
    lowOnset: number;
    energyOnset: number;
}

export interface AtmosphereMotionValues {
    beatPulse: import('framer-motion').MotionValue<number>;
    cinemaScale: import('framer-motion').MotionValue<number>;
    atmosphereEnergy: import('framer-motion').MotionValue<number>;
    atmosphereGroove: import('framer-motion').MotionValue<number>;
    cameraPunch: import('framer-motion').MotionValue<number>;
    sceneParallaxX: import('framer-motion').MotionValue<number>;
    sceneParallaxY: import('framer-motion').MotionValue<number>;
    sceneRoll: import('framer-motion').MotionValue<number>;
}

export const DEFAULT_MOOD_PROFILE: MoodProfile = {
    energy: 0.42,
    aggression: 0.38,
    groove: 0.5,
    space: 0.55,
    brightness: 0.48,
    warmth: 0.5,
    stability: 0.62,
};

export const EMPTY_BEAT_MAP: BeatMap = {
    kicks: [],
    beats: [],
    pulseBeats: [],
    cameraBeats: [],
    duration: 0,
    visualBeatCount: 0,
    tempoSource: 'empty',
    analyzedAt: 0,
};
