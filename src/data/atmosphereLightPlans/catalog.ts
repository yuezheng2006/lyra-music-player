import type { TrackAtmosphereLightPlan } from '../../types/trackAtmosphereLightPlan';

// src/data/atmosphereLightPlans/catalog.ts
// Bundled curated track atmosphere / light plan fixtures.

export const BUNDLED_TRACK_ATMOSPHERE_LIGHT_PLAN_CATALOG: TrackAtmosphereLightPlan[] = [
    {
        version: 1,
        id: 'fixture-melancholy-intimate',
        match: {
            songIds: ['lyra-fixture-atmosphere-001'],
            fingerprints: ['demo artist::midnight hush'],
            aliases: ['demo artist::midnight hush (demo)'],
        },
        atmosphere: {
            labels: ['melancholy', 'intimate'],
            valence: 0.28,
            energy: 0.22,
            arousal: 0.25,
            brightnessBias: 0.25,
            warmth: 0.35,
            confidence: 0.9,
            source: 'manual',
            tempoBpm: 72,
        },
        lighting: {
            mode: 'ambient',
            palette: {
                primary: '#1B2A4A',
                secondary: '#6B7FD7',
                accent: '#A8B4E8',
                from: 'manual',
            },
            static: {
                brightness: 0.28,
                saturation: 0.45,
                colorTempK: 3200,
                transitionMs: 2500,
            },
            dynamics: {
                beatSensitivity: 0.55,
                bassGain: 0.4,
                strobeAllowed: false,
                maxFlashHz: 0,
                idleDrift: 0.25,
            },
            deviceHints: {
                protocol: 'none',
            },
        },
        appBridge: {
            atmosphereHints: {
                rhythmIntensity: 0.72,
                cinemaShake: 0.32,
                atmosphereSensitivity: 0.7,
                cameraPunchStrength: 0.65,
            },
        },
    },
    {
        version: 1,
        id: 'fixture-energetic-nightlife',
        match: {
            fingerprints: ['pulse crew::neon runway'],
        },
        atmosphere: {
            labels: ['energetic', 'nightlife'],
            valence: 0.72,
            energy: 0.88,
            arousal: 0.9,
            brightnessBias: 0.75,
            warmth: 0.4,
            confidence: 0.85,
            source: 'manual',
            tempoBpm: 128,
            danceability: 0.84,
        },
        lighting: {
            mode: 'pulse',
            palette: {
                primary: '#FF2E63',
                secondary: '#08D9D6',
                from: 'mood-map',
            },
            static: {
                brightness: 0.72,
                saturation: 0.85,
                transitionMs: 900,
            },
            dynamics: {
                beatSensitivity: 1.25,
                bassGain: 0.85,
                strobeAllowed: false,
                maxFlashHz: 2,
                idleDrift: 0.55,
            },
            deviceHints: {
                protocol: 'wled',
                effectId: 'reserved-pulse',
            },
        },
        appBridge: {
            atmosphereHints: {
                rhythmIntensity: 1.05,
                cinemaShake: 0.85,
                atmosphereSensitivity: 1.2,
                cameraPunchStrength: 1.15,
            },
        },
    },
];
