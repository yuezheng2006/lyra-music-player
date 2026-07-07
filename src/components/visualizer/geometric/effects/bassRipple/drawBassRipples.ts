import type { BassRipple, InteractiveBackgroundPalette } from '../../interactiveBackground/types';

// src/components/visualizer/geometric/effects/bassRipple/drawBassRipples.ts
// Expanding bass-driven ripple rings on the interactive background canvas.

export const drawBassRipples = (
    context: CanvasRenderingContext2D,
    ripples: BassRipple[],
    palette: InteractiveBackgroundPalette,
) => {
    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const ripple of ripples) {
        const fade = 1 - ripple.life / ripple.maxLife;
        context.globalAlpha = fade * 0.22 * ripple.strength;
        context.strokeStyle = palette.accentSoft;
        context.lineWidth = 1 + ripple.strength * 1.4;
        context.beginPath();
        context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        context.stroke();
    }
    context.restore();
};
