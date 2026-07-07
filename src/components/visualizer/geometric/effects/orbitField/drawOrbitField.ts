import { mapRhythmOrbitBoost } from '../../../../../utils/atmosphere/rhythmPresentation';
import type { OrbitParticle } from '../../buildOrbitParticles';
import type {
    InteractiveBackgroundFrameInputs,
    InteractiveBackgroundPalette,
} from '../../interactiveBackground/types';

import { LYRIC_SCENE_FOCAL_Y } from '../../useInteractiveSceneTransforms';

// src/components/visualizer/geometric/effects/orbitField/drawOrbitField.ts
// Mineradio-style orbit particle field with pointer parallax and beat boost.

export const drawOrbitField = (
    context: CanvasRenderingContext2D,
    particles: OrbitParticle[],
    inputs: InteractiveBackgroundFrameInputs,
    palette: InteractiveBackgroundPalette,
) => {
    const { width, height, now, beatPulse, cameraPunch, cinemaScale, pointerX, pointerY } = inputs;
    const playingBoost = mapRhythmOrbitBoost({ beatPulse, cameraPunch });
    const parallaxX = (pointerX - 0.5) * width * 0.04;
    const parallaxY = (pointerY - 0.5) * height * 0.03;
    const cx = width * 0.5 + parallaxX;
    const cy = height * LYRIC_SCENE_FOCAL_Y + Math.sin(now * 0.28) * height * 0.018 + parallaxY;
    const rx = width * (0.40 + cameraPunch * 0.05);
    const ry = height * (0.30 + cinemaScale * 0.05);

    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
        const speed = particle.speedBase + playingBoost * 0.012;
        const angle = (particle.x * Math.PI * 2 + now * speed + Math.sin(now * 0.07 + particle.seed) * 0.14)
            % (Math.PI * 2);
        const ring = 0.18 + particle.z * 0.82;
        const wobble = Math.sin(now * particle.wobbleFreq + particle.seed) * 12;
        const x = cx + Math.cos(angle) * rx * ring + Math.sin(now * 0.11 + particle.seed) * 24;
        const y = cy + Math.sin(angle * (1 + particle.angleBias)) * ry * ring + wobble;
        const twinkle = Math.pow(
            0.5 + 0.5 * Math.sin(now * particle.twinkleFreq + particle.seed),
            4,
        );
        const radius = Math.max(0.7, particle.size * (0.8 + twinkle * 1.35));
        context.globalAlpha = 0.055 + twinkle * 0.22 + playingBoost * 0.045;
        context.fillStyle = twinkle > 0.74
            ? palette.accent
            : (particle.lane > 0.55 ? palette.secondary : palette.primary);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();

    const aura = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.54);
    aura.addColorStop(0, palette.accentSoft);
    aura.addColorStop(0.34, palette.secondarySoft);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.globalAlpha = 0.88;
    context.fillStyle = aura;
    context.fillRect(0, 0, width, height);
};
