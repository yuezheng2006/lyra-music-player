import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearLocalTrackAtmosphereLightPlanCache,
    upsertLocalTrackAtmosphereLightPlan,
} from '@/utils/atmosphere/localTrackAtmosphereLightPlanCache';
import {
    buildTrackAtmosphereLightPlanCatalogRows,
    parseTrackAtmosphereLightPlanImport,
} from '@/utils/atmosphere/trackAtmosphereLightPlanSettingsMath';

// test/unit/atmosphere/trackAtmosphereLightPlanSettingsMath.test.ts

const memoryStore = new Map<string, string>();

describe('trackAtmosphereLightPlanSettingsMath', () => {
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

    it('parses single plan and plans array payloads', () => {
        const single = parseTrackAtmosphereLightPlanImport(JSON.stringify({
            version: 1,
            id: 'import-one',
            match: { songIds: ['imp-1'] },
            atmosphere: {
                labels: ['warm'],
                valence: 0.5,
                energy: 0.5,
                arousal: 0.5,
                brightnessBias: 0.5,
                warmth: 0.5,
                confidence: 1,
                source: 'manual',
            },
            lighting: {
                mode: 'ambient',
                palette: { primary: '#111111', secondary: '#222222', from: 'manual' },
                static: { brightness: 0.4, saturation: 0.4, transitionMs: 1000 },
                dynamics: {
                    beatSensitivity: 0.8,
                    bassGain: 0.4,
                    strobeAllowed: false,
                    maxFlashHz: 0,
                    idleDrift: 0.2,
                },
            },
            appBridge: { atmosphereHints: { atmosphereSensitivity: 0.9 } },
        }));
        expect(single.plans).toHaveLength(1);
        expect(single.plans[0].id).toBe('import-one');

        const wrapped = parseTrackAtmosphereLightPlanImport(JSON.stringify({
            plans: [single.plans[0], { version: 1, id: 'bad' }],
        }));
        expect(wrapped.plans).toHaveLength(1);
        expect(wrapped.errors.length).toBeGreaterThan(0);
    });

    it('marks active local override in catalog rows', () => {
        upsertLocalTrackAtmosphereLightPlan({
            version: 1,
            id: 'local-active',
            match: { songIds: ['lyra-fixture-atmosphere-001'] },
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
                palette: { primary: '#010203', secondary: '#040506', from: 'manual' },
                static: { brightness: 0.2, saturation: 0.2, transitionMs: 1000 },
                dynamics: {
                    beatSensitivity: 0.5,
                    bassGain: 0.3,
                    strobeAllowed: false,
                    maxFlashHz: 0,
                    idleDrift: 0.2,
                },
            },
            appBridge: { atmosphereHints: { atmosphereSensitivity: 0.7 } },
        });

        const rows = buildTrackAtmosphereLightPlanCatalogRows({
            songId: 'lyra-fixture-atmosphere-001',
        });
        const active = rows.find((row) => row.activeForSong);
        expect(active?.source).toBe('local');
        expect(active?.plan.id).toBe('local-active');
        expect(rows.some((row) => row.source === 'bundled')).toBe(true);
    });
});
