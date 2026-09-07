import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listBundledTrackAtmosphereLightPlans } from '@/data/atmosphereLightPlans';
import {
    clearLocalTrackAtmosphereLightPlanCache,
    upsertLocalTrackAtmosphereLightPlan,
} from '@/utils/atmosphere/localTrackAtmosphereLightPlanCache';
import { resolveTrackAtmosphereLightPlan } from '@/utils/atmosphere/resolveTrackAtmosphereLightPlan';

// test/unit/atmosphere/resolveTrackAtmosphereLightPlan.test.ts

const memoryStore = new Map<string, string>();

describe('resolveTrackAtmosphereLightPlan', () => {
    beforeEach(() => {
        memoryStore.clear();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => memoryStore.get(key) ?? null,
            setItem: (key: string, value: string) => { memoryStore.set(key, value); },
            removeItem: (key: string) => { memoryStore.delete(key); },
            clear: () => { memoryStore.clear(); },
        });
    });

    afterEach(() => {
        clearLocalTrackAtmosphereLightPlanCache();
        vi.unstubAllGlobals();
    });

    it('ships bundled fixture plans', () => {
        const bundled = listBundledTrackAtmosphereLightPlans();
        expect(bundled.length).toBeGreaterThanOrEqual(2);
        expect(bundled.some((plan) => plan.id === 'fixture-melancholy-intimate')).toBe(true);
    });

    it('resolves bundled plans by songId and fingerprint', () => {
        const byId = resolveTrackAtmosphereLightPlan({
            songId: 'lyra-fixture-atmosphere-001',
        });
        expect(byId?.source).toBe('bundled');
        expect(byId?.plan.id).toBe('fixture-melancholy-intimate');

        const byFp = resolveTrackAtmosphereLightPlan({
            artist: 'Pulse Crew',
            title: 'Neon Runway',
        });
        expect(byFp?.source).toBe('bundled');
        expect(byFp?.plan.id).toBe('fixture-energetic-nightlife');
    });

    it('prefers local overrides over bundled matches', () => {
        const bundled = resolveTrackAtmosphereLightPlan({
            songId: 'lyra-fixture-atmosphere-001',
        });
        expect(bundled?.source).toBe('bundled');

        upsertLocalTrackAtmosphereLightPlan({
            version: 1,
            id: 'local-override-melancholy',
            match: {
                songIds: ['lyra-fixture-atmosphere-001'],
            },
            atmosphere: {
                labels: ['intimate'],
                valence: 0.3,
                energy: 0.2,
                arousal: 0.2,
                brightnessBias: 0.2,
                warmth: 0.3,
                confidence: 1,
                source: 'manual',
            },
            lighting: {
                mode: 'ambient',
                palette: {
                    primary: '#010203',
                    secondary: '#040506',
                    from: 'manual',
                },
                static: {
                    brightness: 0.2,
                    saturation: 0.2,
                    transitionMs: 1000,
                },
                dynamics: {
                    beatSensitivity: 0.5,
                    bassGain: 0.3,
                    strobeAllowed: false,
                    maxFlashHz: 0,
                    idleDrift: 0.2,
                },
            },
            appBridge: {
                atmosphereHints: {
                    atmosphereSensitivity: 0.66,
                },
            },
        });

        const resolved = resolveTrackAtmosphereLightPlan({
            songId: 'lyra-fixture-atmosphere-001',
        });
        expect(resolved?.source).toBe('local');
        expect(resolved?.plan.id).toBe('local-override-melancholy');
        expect(resolved?.plan.appBridge.atmosphereHints.atmosphereSensitivity).toBe(0.66);
    });

    it('returns null when nothing matches', () => {
        expect(resolveTrackAtmosphereLightPlan({
            songId: 'no-such-track',
            artist: 'Nobody',
            title: 'Nowhere',
        })).toBeNull();
    });
});
