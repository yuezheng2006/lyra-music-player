import { describe, expect, it } from 'vitest';
import { CoverParticleRippleField } from '../../../src/components/visualizer/geometric/webgl/coverParticleRipples';

describe('CoverParticleRippleField', () => {
    it('spawns Emily band ripples from bass onset and writes active count to texture', () => {
        const field = new CoverParticleRippleField();
        let active = 0;

        // Quiet priming frames, then a kick so the band tracker fires an onset.
        for (let frame = 0; frame < 12; frame += 1) {
            field.tick(0.05, frame * 0.05, 0.08, 0.05, 0.04, true, false);
        }
        for (let frame = 12; frame < 40; frame += 1) {
            active = field.tick(0.05, frame * 0.05, 0.85, 0.12, 0.08, true, false);
            if (active > 0) break;
        }

        expect(active).toBeGreaterThan(0);
        field.dispose();
    });

    it('spawns mid/treble ripples without relying on bass alone', () => {
        const field = new CoverParticleRippleField();
        let active = 0;

        for (let frame = 0; frame < 12; frame += 1) {
            field.tick(0.05, frame * 0.05, 0.05, 0.06, 0.05, true, false);
        }
        for (let frame = 12; frame < 40; frame += 1) {
            active = field.tick(0.05, frame * 0.05, 0.06, 0.82, 0.78, true, false);
            if (active > 0) break;
        }

        expect(active).toBeGreaterThan(0);
        field.dispose();
    });

    it('clears ripples while paused', () => {
        const field = new CoverParticleRippleField();
        for (let frame = 0; frame < 12; frame += 1) {
            field.tick(0.05, frame * 0.05, 0.08, 0.05, 0.04, true, false);
        }
        field.tick(0.05, 1, 0.9, 0.2, 0.1, true, false);
        const activeWhilePaused = field.tick(0.05, 1.05, 0.9, 0.2, 0.1, true, true);
        expect(activeWhilePaused).toBe(0);
        field.dispose();
    });
});
