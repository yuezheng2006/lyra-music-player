import { computeCinemaDrift, type CinemaDriftFrame } from '../../../../utils/atmosphere/cinemaDrift';

// src/components/visualizer/geometric/webgl/coverParticleCinemaCamera.ts
// Mineradio-style idle orbit drift for WebGL cover particle camera.

export class CoverParticleCinemaCamera {
    private cinemaTimeSec = 0;

    private beatKick = { thetaKick: 0, phiKick: 0, radiusKick: 0 };

    private prevBeat = 0;

    reset() {
        this.cinemaTimeSec = 0;
        this.beatKick = { thetaKick: 0, phiKick: 0, radiusKick: 0 };
        this.prevBeat = 0;
    }

    /** Advances cinema drift and returns orbit offsets for the current frame. */
    tick(
        dt: number,
        beat: number,
        cinemaShake: number,
        atmosphereEnergy = 0,
    ): CinemaDriftFrame {
        this.cinemaTimeSec += dt;

        if (beat > this.prevBeat + 0.10) {
            this.beatKick.thetaKick = Math.max(this.beatKick.thetaKick, beat * 0.020);
            this.beatKick.phiKick = Math.max(this.beatKick.phiKick, beat * 0.016);
            this.beatKick.radiusKick = Math.max(this.beatKick.radiusKick, beat * 0.070);
        }
        this.prevBeat = beat;
        this.beatKick.thetaKick *= 0.90;
        this.beatKick.phiKick *= 0.90;
        this.beatKick.radiusKick *= 0.90;

        return computeCinemaDrift(
            this.cinemaTimeSec,
            cinemaShake,
            this.beatKick,
            { djBoost: atmosphereEnergy > 0.42 },
        );
    }
}

export const applyCoverParticleCinemaOffset = (
    baseZ: number,
    offset: CinemaDriftFrame,
): { x: number; y: number; z: number } => ({
    x: Math.sin(offset.thetaKick) * baseZ * 0.34,
    y: Math.sin(offset.phiKick) * baseZ * 0.26,
    z: baseZ + offset.radiusKick * 2.4 + Math.cos(offset.thetaKick * 0.6) * 0.18,
});
