import { mapRhythmOrbitBoost } from '../../../../../utils/atmosphere/rhythmPresentation';
import type { BloomParticle } from './buildBloomParticles';
import type {
    InteractiveBackgroundFrameInputs,
    InteractiveBackgroundPalette,
} from '../../interactiveBackground/types';
import { LYRIC_SCENE_FOCAL_Y } from '../../useInteractiveSceneTransforms';

// src/components/visualizer/geometric/effects/bloomParticle/drawBloomParticles.ts
// Draws Mineradio-style additive bloom particles on canvas.

export const drawBloomParticles = (
    context: CanvasRenderingContext2D,
    particles: BloomParticle[],
    inputs: InteractiveBackgroundFrameInputs,
    palette: InteractiveBackgroundPalette,
    bloomStrength: number,
    rhythmIntensity: number,
) => {
    if (bloomStrength <= 0.01 || particles.length === 0) return;

    const { width, height, now, beatPulse, cameraPunch, cinemaScale, pointerX, pointerY } = inputs;
    const playingBoost = mapRhythmOrbitBoost({ beatPulse, cameraPunch }) * rhythmIntensity;
    const parallaxX = (pointerX - 0.5) * width * 0.03;
    const parallaxY = (pointerY - 0.5) * height * 0.025;
    const cx = width * 0.5 + parallaxX;
    const cy = height * LYRIC_SCENE_FOCAL_Y + parallaxY;
    const rx = width * (0.36 + cinemaScale * 0.06 + playingBoost * 0.04);
    const ry = height * (0.28 + cinemaScale * 0.05);

    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
        const speed = 0.018 + playingBoost * 0.01;
        const angle = (particle.angle + now * speed + Math.sin(now * 0.05 + particle.seed) * 0.1) % (Math.PI * 2);
        const wobble = Math.sin(now * particle.wobbleFreq + particle.seed) * 10;
        const x = cx + Math.cos(angle) * rx * particle.ring + wobble;
        const y = cy + Math.sin(angle * (1 + particle.z * 0.4)) * ry * particle.ring;
        const twinkle = Math.pow(0.5 + 0.5 * Math.sin(now * particle.twinkleFreq + particle.seed), 3);
        const radius = particle.size * (0.9 + twinkle * 1.4);
        const alpha = bloomStrength * 0.22 * (0.45 + twinkle * 0.55 + playingBoost * 0.25);
        context.globalAlpha = alpha;
        context.fillStyle = particle.lane > 0.55 ? palette.accent : palette.primary;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();
};
