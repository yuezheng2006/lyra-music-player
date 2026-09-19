import type { Interactive3dSceneTuning } from '../../../../types';

// src/components/visualizer/geometric/webgl/coverParticleWebGLGateMath.ts
// Legacy CoverParticle WebGL is debug-only. Live interactive3d uses R3F+GSAP.
// Escape hatch: localStorage lyra_force_cover_webgl=1

/** Pure gate — legacy CoverParticle WebGL only when force flag is set. */
export const resolveShouldShowCoverParticleWebGL = (input: {
    tuning?: Interactive3dSceneTuning;
    isElectron?: boolean;
    forceWebGL?: boolean;
}): boolean => {
    void input.isElectron;
    void input.tuning;
    if (input.forceWebGL) return true;
    if (typeof localStorage !== 'undefined') {
        try {
            if (localStorage.getItem('lyra_force_cover_webgl') === '1') return true;
        } catch {
            // ignore storage access failures
        }
    }
    return false;
};

/** Convenience gate used by GeometricLayer / CoverParticleStage. */
export const shouldShowCoverParticleWebGL = (tuning?: Interactive3dSceneTuning): boolean => (
    resolveShouldShowCoverParticleWebGL({ tuning })
);
