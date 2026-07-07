import { clamp01 } from '../../../../utils/atmosphere/math';

// src/components/visualizer/geometric/webgl/coverParticleBurstSmoother.ts
// Beat-triggered burst envelope for tunnel/starfield shader uBurstAmt.

export class CoverParticleBurstSmoother {
    private burst = 0;

    private prevBeat = 0;

    reset() {
        this.burst = 0;
        this.prevBeat = 0;
    }

    /** Returns 0–1 burst amount; spikes on beat rises and decays like Mineradio uBurstAmt. */
    tick(beat: number, dt: number): number {
        const beatClamped = clamp01(beat);
        if (beatClamped > this.prevBeat + 0.07) {
            this.burst = Math.max(this.burst, beatClamped * 0.48 + 0.14);
        }
        this.prevBeat = beatClamped;
        const decay = Math.pow(0.90, Math.min(1, Math.max(0.001, dt)) * 60);
        this.burst *= decay;
        return clamp01(this.burst);
    }

    /** Preset/visual transitions in Mineradio also pump uBurstAmt. */
    trigger(amount: number) {
        this.burst = Math.max(this.burst, clamp01(amount));
    }
}
