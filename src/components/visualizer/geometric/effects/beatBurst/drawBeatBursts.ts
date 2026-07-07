import type { BeatParticle } from '../../../atmosphere/beatParticleTypes';
import type { InteractiveBackgroundPalette } from '../../interactiveBackground/types';

// src/components/visualizer/geometric/effects/beatBurst/drawBeatBursts.ts
// Beat-triggered particle bursts rendered on the interactive background canvas.

export const drawBeatBursts = (
    context: CanvasRenderingContext2D,
    particles: BeatParticle[],
    palette: InteractiveBackgroundPalette,
    energy: number,
) => {
    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
        const fade = 1 - particle.life / particle.maxLife;
        context.globalAlpha = particle.alpha * fade * (0.35 + energy * 0.5);
        context.fillStyle = particle.useAccent ? palette.accent : palette.primary;
        context.beginPath();
        context.arc(
            particle.x,
            particle.y,
            particle.size * (0.6 + fade * 0.8),
            0,
            Math.PI * 2,
        );
        context.fill();
    }
    context.restore();
};
