import type { InteractiveBackgroundPalette } from '../../interactiveBackground/types';

// src/components/visualizer/geometric/effects/backgroundWash/drawBackgroundWash.ts
// Base gradient wash for the interactive background canvas.

export const drawBackgroundWash = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    palette: InteractiveBackgroundPalette,
) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(5, 6, 8, 0.16)');
    gradient.addColorStop(0.52, palette.primarySoft);
    gradient.addColorStop(1, palette.secondarySoft);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
};
