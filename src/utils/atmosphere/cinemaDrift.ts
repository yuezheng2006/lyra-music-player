// src/utils/atmosphere/cinemaDrift.ts
// Mineradio updateCinema idle orbit drift (v8 amplitudes).

export interface CinemaDriftFrame {
    thetaKick: number;
    phiKick: number;
    radiusKick: number;
}

export const computeCinemaDrift = (
    cinemaTimeSec: number,
    cinemaShake: number,
    beatFrame: CinemaDriftFrame,
    options: { djBoost?: boolean; focusActive?: boolean } = {},
): CinemaDriftFrame => {
    const shake = Math.max(0, Math.min(1.8, cinemaShake));
    if (shake <= 0.001) {
        return beatFrame;
    }

    const dj = options.djBoost ? 1.12 : 1;
    const beatDamp = (options.focusActive ? 0.55 : 1) * shake * dj;
    const idleDamp = shake * (options.djBoost ? 0.72 : 1);

    return {
        thetaKick: Math.sin(cinemaTimeSec * 0.08) * 0.012 * idleDamp + beatFrame.thetaKick * beatDamp,
        phiKick: Math.sin(cinemaTimeSec * 0.06 + 1) * 0.010 * idleDamp + beatFrame.phiKick * beatDamp,
        radiusKick: Math.sin(cinemaTimeSec * 0.04 + 2) * 0.080 * idleDamp - beatFrame.radiusKick * beatDamp * (dj > 1 ? 1.22 : 1.18),
    };
};
