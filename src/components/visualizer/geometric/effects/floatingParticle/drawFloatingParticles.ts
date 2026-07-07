import type { FloatingParticle } from './buildFloatingParticles';
import type {
    InteractiveBackgroundFrameInputs,
    InteractiveBackgroundPalette,
} from '../../interactiveBackground/types';
import { LYRIC_SCENE_FOCAL_Y } from '../../useInteractiveSceneTransforms';

// src/components/visualizer/geometric/effects/floatingParticle/drawFloatingParticles.ts
// Draws Mineradio-style floating particle halo on canvas.

export const drawFloatingParticles = (
    context: CanvasRenderingContext2D,
    particles: FloatingParticle[],
    inputs: InteractiveBackgroundFrameInputs,
    palette: InteractiveBackgroundPalette,
    rhythmIntensity: number,
) => {
    const { width, height, now, bassLevel, pointerX, pointerY } = inputs;
    const cx = width * 0.5 + (pointerX - 0.5) * width * 0.02;
    const cy = height * LYRIC_SCENE_FOCAL_Y + (pointerY - 0.5) * height * 0.02;
    const spreadX = width * 0.46;
    const spreadY = height * 0.36;

    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
        const orbit = now * (0.03 + particle.seed * 0.034);
        const cs = Math.cos(orbit);
        const sn = Math.sin(orbit);
        const breathe = 1 + Math.sin(now * 0.34 + particle.phaseX) * 0.045;
        let x = particle.baseX * breathe;
        let y = particle.baseY * breathe;
        const rx = x * cs - y * sn;
        const ry = x * sn + y * cs;
        x = rx * spreadX + cx + Math.sin(now * 0.18 + particle.phaseX) * particle.amp * spreadX * 0.08;
        y = ry * spreadY + cy + Math.cos(now * 0.15 + particle.phaseY) * particle.amp * spreadY * 0.07;
        y += Math.sin(now * 0.11 + particle.phaseZ) * particle.amp * 28 + bassLevel * 12 * rhythmIntensity;
        const twinkle = 0.62 + 0.38 * Math.sin(now * (0.42 + particle.seed * 0.34) + particle.phaseZ);
        const radius = particle.halo ? 1.1 + twinkle * 1.6 : 0.8 + twinkle * 1.1;
        context.globalAlpha = (0.04 + twinkle * 0.12) * rhythmIntensity;
        context.fillStyle = palette.accentSoft;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();
};
