import { buildRhythmPresentation } from '../../../../../utils/atmosphere/rhythmPresentation';
import type { InteractiveBackgroundFrameInputs } from '../../interactiveBackground/types';
import { LYRIC_SCENE_FOCAL_Y } from '../../useInteractiveSceneTransforms';

// src/components/visualizer/geometric/effects/lyricFocusAura/drawLyricFocusAura.ts
// Soft focal glow anchored where lyrics sit above the 3D background layer.

export const drawLyricFocusAura = (
    context: CanvasRenderingContext2D,
    inputs: InteractiveBackgroundFrameInputs,
    accentSoft: string,
) => {
    const { width, height, pointerX, pointerY } = inputs;
    const rhythm = buildRhythmPresentation(
        inputs.beatPulse,
        inputs.cameraPunch,
        inputs.cinemaScale,
        inputs.atmosphereEnergy,
    );
    const cx = width * 0.5 + (pointerX - 0.5) * width * 0.04;
    const cy = height * LYRIC_SCENE_FOCAL_Y + (pointerY - 0.5) * height * 0.03;
    const radius = Math.max(width, height) * (0.18 + rhythm.beatPulse * 0.06 + rhythm.atmosphereEnergy * 0.04);
    const aura = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    aura.addColorStop(0, accentSoft);
    aura.addColorStop(0.42, 'rgba(255,255,255,0.04)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = rhythm.auraAlpha;
    context.fillStyle = aura;
    context.fillRect(0, 0, width, height);
    context.restore();
};
