import { describe, expect, it } from 'vitest';
import { CoverParticleRippleField } from '../../../src/components/visualizer/geometric/webgl/coverParticleRipples';

describe('CoverParticleRippleField', () => {
    it('spawns Emily bass ripples and writes active count to texture', () => {
        const field = new CoverParticleRippleField();
        let active = 0;

        for (let frame = 0; frame < 40; frame += 1) {
            active = field.tick(0.05, frame * 0.05, 0.72, true, false);
            if (active > 0) break;
        }

        expect(active).toBeGreaterThan(0);
        field.dispose();
    });

    it('clears ripples while paused', () => {
        const field = new CoverParticleRippleField();
        field.tick(0.05, 1, 0.8, true, false);
        const activeWhilePaused = field.tick(0.05, 1.05, 0.8, true, true);
        expect(activeWhilePaused).toBe(0);
        field.dispose();
    });
});
