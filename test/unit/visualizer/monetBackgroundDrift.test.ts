import { describe, expect, it } from 'vitest';
import { buildMonetDriftTrack } from '@/components/visualizer/backgrounds/monetBackgroundDrift';

// test/unit/visualizer/monetBackgroundDrift.test.ts

describe('buildMonetDriftTrack', () => {
    it('builds a looping compositor track whose scale stays above the travel budget', () => {
        const track = buildMonetDriftTrack(0.55);
        expect(track.keyframes.length).toBeGreaterThan(10);
        expect(track.durationMs).toBe(240_000);
        expect(track.minScale).toBeGreaterThan(1);
        expect(track.keyframes[0].transform).toContain('translate3d');
    });
});
