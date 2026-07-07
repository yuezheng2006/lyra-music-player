import { describe, expect, it } from 'vitest';
import {
    buildBeatMapFromLowEnergy,
    shouldUsePodcastDjBeatMap,
} from '@/utils/atmosphere/podcastDjBeatMap';

// test/unit/atmosphere/podcastDjBeatMap.test.ts
// Synthetic coverage for podcast DJ low-energy beat-map construction.

const makeEnergyGrid = ({
    durationSec = 24,
    hopSec = 0.01,
    stepSec = 0.5,
    startSec = 1,
}) => {
    const frameCount = Math.floor(durationSec / hopSec);
    const lowEnergy = new Float32Array(frameCount).fill(0.004);
    const hitEnergy = new Float32Array(frameCount).fill(0.003);
    for (let time = startSec; time < durationSec - 0.5; time += stepSec) {
        const center = Math.round(time / hopSec);
        for (let offset = -3; offset <= 5; offset += 1) {
            const frame = center + offset;
            if (frame < 0 || frame >= frameCount) continue;
            const falloff = Math.exp(-Math.abs(offset) * 0.55);
            lowEnergy[frame] += 0.1 * falloff;
            hitEnergy[frame] += 0.06 * falloff;
        }
    }
    return { lowEnergy, hitEnergy, hopSec, durationSec };
};

describe('podcastDjBeatMap', () => {
    it('returns an empty podcast map for short energy arrays', () => {
        const map = buildBeatMapFromLowEnergy(
            new Float32Array(12),
            new Float32Array(12),
            0.01,
            0.12,
        );

        expect(map.tempoSource).toBe('podcast-dj-server-empty');
        expect(map.beats).toEqual([]);
        expect(map.pulseBeats).toEqual([]);
        expect(map.cameraBeats).toEqual([]);
        expect(map.duration).toBe(0.12);
    });

    it('builds a stable grid from synthetic low and hit energy pulses', () => {
        const { lowEnergy, hitEnergy, hopSec, durationSec } = makeEnergyGrid({});
        const map = buildBeatMapFromLowEnergy(lowEnergy, hitEnergy, hopSec, durationSec);

        expect(map.tempoSource).toBe('podcast-dj-server-low-offline');
        expect(map.debug.candidates).toBeGreaterThan(10);
        expect(map.gridStep).toBeGreaterThan(0.42);
        expect(map.gridStep).toBeLessThan(0.58);
        expect(map.beats.length).toBeGreaterThan(30);
        expect(map.cameraBeats.length).toBeGreaterThan(20);
        expect(map.visualBeatCount).toBe(map.cameraBeats.length);
        expect(map.kicks).toHaveLength(map.beats.length);
        expect(map.pulseBeats.every(beat => beat.time >= 0 && beat.time <= durationSec)).toBe(true);
    });

    it('preserves long-form section step metadata', () => {
        const { lowEnergy, hitEnergy, hopSec, durationSec } = makeEnergyGrid({
            durationSec: 150,
            stepSec: 0.62,
        });
        const map = buildBeatMapFromLowEnergy(lowEnergy, hitEnergy, hopSec, durationSec);

        expect(map.duration).toBe(150);
        expect(map.sectionSteps.length).toBeGreaterThan(1);
        expect(map.sectionSteps.every(step => step >= 0.32 && step <= 0.86)).toBe(true);
        expect(map.beats[0]).toMatchObject({
            dj: true,
            grid: true,
            kickOnly: true,
            server: true,
        });
    });

    it('selects podcast DJ maps for podcasts and ten-minute-plus audio', () => {
        expect(shouldUsePodcastDjBeatMap(601, 'music')).toBe(true);
        expect(shouldUsePodcastDjBeatMap(120, 'podcast')).toBe(true);
        expect(shouldUsePodcastDjBeatMap(180, 'music')).toBe(false);
    });
});
