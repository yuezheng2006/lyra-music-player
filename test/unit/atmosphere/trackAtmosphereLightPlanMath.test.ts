import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import type { TrackAtmosphereLightPlan } from '@/types/trackAtmosphereLightPlan';
import { applyAtmosphereThemeHintsToTuning } from '@/utils/atmosphere/applyAtmosphereThemeHints';
import {
    atmosphereHintsFromTrackPlan,
    buildTrackAtmosphereFingerprint,
    buildTrackAtmosphereSongMeta,
    mergeAtmosphereHintsWithTrackPlan,
    sanitizeTrackAtmosphereLightPlan,
    trackAtmosphereLightPlanMatches,
} from '@/utils/atmosphere/trackAtmosphereLightPlanMath';

// test/unit/atmosphere/trackAtmosphereLightPlanMath.test.ts

const samplePlan = (): TrackAtmosphereLightPlan => ({
    version: 1,
    id: 'unit-sample',
    match: {
        songIds: ['42'],
        fingerprints: ['artist x::song y'],
        aliases: ['artist x::song y (live)'],
    },
    atmosphere: {
        labels: ['warm', 'dreamy'],
        valence: 0.6,
        energy: 0.4,
        arousal: 0.35,
        brightnessBias: 0.5,
        warmth: 0.7,
        confidence: 0.8,
        source: 'manual',
    },
    lighting: {
        mode: 'ambient',
        palette: {
            primary: '#112233',
            secondary: '#445566',
            from: 'manual',
        },
        static: {
            brightness: 0.4,
            saturation: 0.5,
            transitionMs: 1200,
        },
        dynamics: {
            beatSensitivity: 0.9,
            bassGain: 0.5,
            strobeAllowed: false,
            maxFlashHz: 0,
            idleDrift: 0.3,
        },
        deviceHints: { protocol: 'hue', entertainmentMode: true },
    },
    appBridge: {
        atmosphereHints: {
            visualPreset: 'mineradioGalaxy',
            rhythmIntensity: 0.8,
            cinemaShake: 0.4,
            atmosphereSensitivity: 0.95,
            cameraPunchStrength: 0.88,
        },
    },
});

describe('trackAtmosphereLightPlanMath', () => {
    it('builds normalized artist::title fingerprints', () => {
        expect(buildTrackAtmosphereFingerprint('  Artist   X ', 'Song   Y')).toBe('artist x::song y');
        expect(buildTrackAtmosphereFingerprint(null, null)).toBeNull();
    });

    it('matches by songId, fingerprint, and alias', () => {
        const plan = samplePlan();
        expect(trackAtmosphereLightPlanMatches(plan, { songId: 42 })).toBe(true);
        expect(trackAtmosphereLightPlanMatches(plan, {
            title: 'Song Y',
            artist: 'Artist X',
        })).toBe(true);
        expect(trackAtmosphereLightPlanMatches(plan, {
            title: 'Song Y (live)',
            artist: 'Artist X',
        })).toBe(true);
        expect(trackAtmosphereLightPlanMatches(plan, {
            title: 'Other',
            artist: 'Artist X',
        })).toBe(false);
    });

    it('sanitizes plans and clamps atmosphereHints', () => {
        const dirty = {
            ...samplePlan(),
            appBridge: {
                atmosphereHints: {
                    visualPreset: 'emily',
                    rhythmIntensity: 9,
                    atmosphereSensitivity: -1,
                    cameraPunchStrength: 0.88,
                },
            },
            lighting: {
                ...samplePlan().lighting,
                static: {
                    brightness: 2,
                    saturation: -1,
                    colorTempK: 9000,
                    transitionMs: 100,
                },
            },
        };
        const plan = sanitizeTrackAtmosphereLightPlan(dirty);
        expect(plan).not.toBeNull();
        expect(plan?.appBridge.atmosphereHints.visualPreset).toBeUndefined();
        expect(plan?.appBridge.atmosphereHints.rhythmIntensity).toBe(1.2);
        expect(plan?.appBridge.atmosphereHints.atmosphereSensitivity).toBe(0.55);
        expect(plan?.lighting.static.brightness).toBe(1);
        expect(plan?.lighting.static.saturation).toBe(0);
        expect(plan?.lighting.static.colorTempK).toBe(6500);
        expect(plan?.lighting.deviceHints?.protocol).toBe('hue');
    });

    it('rejects invalid version or missing match keys', () => {
        expect(sanitizeTrackAtmosphereLightPlan({ ...samplePlan(), version: 2 })).toBeNull();
        expect(sanitizeTrackAtmosphereLightPlan({
            ...samplePlan(),
            match: {},
        })).toBeNull();
    });

    it('merges plan hints over theme hints and keeps visualPreset sticky on apply', () => {
        const plan = samplePlan();
        const merged = mergeAtmosphereHintsWithTrackPlan(
            {
                visualPreset: 'emily',
                rhythmIntensity: 0.6,
                atmosphereSensitivity: 0.6,
            },
            plan,
        );
        expect(merged.visualPreset).toBeUndefined();
        expect(merged.rhythmIntensity).toBe(0.8);
        expect(merged.atmosphereSensitivity).toBe(0.95);

        const next = applyAtmosphereThemeHintsToTuning(
            {
                ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
                visualPreset: 'emily',
                rhythmIntensity: 0.5,
            },
            atmosphereHintsFromTrackPlan(plan),
        );
        expect(next?.visualPreset).toBe('emily');
        expect(next?.rhythmIntensity).toBe(0.8);
    });

    it('builds song meta from netease-like artist fields', () => {
        const meta = buildTrackAtmosphereSongMeta({
            id: 7,
            name: 'Hello',
            ar: [{ name: 'A' }, { name: 'B' }],
        });
        expect(meta).toEqual({
            songId: 7,
            title: 'Hello',
            artist: 'A, B',
        });
    });
});
