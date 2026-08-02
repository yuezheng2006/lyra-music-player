// src/utils/visualizer/turntable/drawAlbumCanvasScene.ts
// Deck-only turntable: transparent canvas over the stage wash (no wooden table).

import { bakeDiscSurfaceCanvas } from './bakeVinylGl';
import { paintVinylSpinLayer } from './bakeVinylSpinLayer';
import {
    drawTurntableHardwareOverlayForLayout,
} from './drawTurntableHardware';
import type { TurntableLayout } from './turntableLayout';
import { VINYL_LABEL_DIAMETER_RATIO, VINYL_SCENE_LIGHT } from './vinylSurfaceMath';

export type TurntableTextures = {
    walnut: HTMLImageElement | null;
    walnutRough: HTMLImageElement | null;
    dust: HTMLImageElement | null;
    scratches: HTMLImageElement | null;
    metal: HTMLImageElement | null;
};

export type TurntableBakeCache = {
    vinyl: HTMLCanvasElement | null;
    platter: HTMLCanvasElement | null;
    spin: HTMLCanvasElement | null;
};

const TURNTABLE_ASSET = {
    walnut: '/turntable/walnut.jpg',
    walnutRough: '/turntable/walnut-roughness.jpg',
    dust: '/turntable/dust.jpg',
    scratches: '/turntable/scratches.jpg',
    metal: '/turntable/metal.jpg',
} as const;

const loadImage = (src: string): Promise<HTMLImageElement | null> => (
    new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    })
);

export const loadTurntableTextures = async (): Promise<TurntableTextures> => {
    const [dust, scratches, metal] = await Promise.all([
        loadImage(TURNTABLE_ASSET.dust),
        loadImage(TURNTABLE_ASSET.scratches),
        loadImage(TURNTABLE_ASSET.metal),
    ]);
    return { walnut: null, walnutRough: null, dust, scratches, metal };
};

export const createTurntableBakeCache = (size = 1024): TurntableBakeCache => {
    const vinyl = bakeDiscSurfaceCanvas(size, 'vinyl');
    const platter = bakeDiscSurfaceCanvas(size, 'platter');
    const spin = document.createElement('canvas');
    spin.width = size;
    spin.height = size;
    const spinCtx = spin.getContext('2d');
    if (spinCtx) paintVinylSpinLayer(spinCtx, size);
    return { vinyl, platter, spin };
};

const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
) => {
    const radius = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
};

const drawCoverContain = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
) => {
    // Letterbox into the square — never crop the artwork.
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
};

/** Circular label still fills the disc center (intentional crop to circle). */
const drawCoverFill = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
) => {
    const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
};

/** Paint floating turntable: dark mat + platter + vinyl + tonearm (no chassis). */
export const drawAlbumCanvasScene = (
    ctx: CanvasRenderingContext2D,
    layout: TurntableLayout,
    input: {
        textures: TurntableTextures;
        bake: TurntableBakeCache;
        cover: HTMLImageElement | null;
        degrees: number;
    },
): void => {
    const { width: w, height: h, platterD, recordD, platterCx, platterCy, sleeveSide, sleeveCx, sleeveCy } = layout;
    const radians = (input.degrees * Math.PI) / 180;
    const textures = input.textures;

    ctx.clearRect(0, 0, w, h);

    // Optional tiny cover (currently disabled via sleeveSide === 0).
    if (sleeveSide > 1) {
        const sx = sleeveCx - sleeveSide / 2;
        const sy = sleeveCy - sleeveSide / 2;
        const corner = Math.max(2, sleeveSide * 0.02);
        ctx.save();
        roundRect(ctx, sx, sy, sleeveSide, sleeveSide, corner);
        ctx.clip();
        ctx.fillStyle = 'rgb(232, 226, 214)';
        ctx.fillRect(sx, sy, sleeveSide, sleeveSide);
        if (input.cover) drawCoverContain(ctx, input.cover, sx, sy, sleeveSide);
        ctx.restore();
    }

    // Soft grounding shadow under the mat.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(
        platterCx - VINYL_SCENE_LIGHT.x * recordD * 0.03,
        platterCy - VINYL_SCENE_LIGHT.y * recordD * 0.03,
        platterD * 0.52,
        platterD * 0.48,
        0,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    // Dark rubber mat ring (replaces white aluminum chassis).
    const matOuter = platterD * 0.52;
    const matInner = recordD * 0.48;
    const mat = ctx.createRadialGradient(platterCx, platterCy, matInner, platterCx, platterCy, matOuter);
    mat.addColorStop(0, 'rgba(18, 12, 10, 0)');
    mat.addColorStop(0.55, 'rgba(28, 18, 14, 0.72)');
    mat.addColorStop(0.82, 'rgba(42, 28, 22, 0.88)');
    mat.addColorStop(1, 'rgba(12, 8, 6, 0.35)');
    ctx.fillStyle = mat;
    ctx.beginPath();
    ctx.arc(platterCx, platterCy, matOuter, 0, Math.PI * 2);
    ctx.fill();

    // Machined platter (GL) under the vinyl.
    if (input.bake.platter) {
        ctx.drawImage(input.bake.platter, platterCx - platterD / 2, platterCy - platterD / 2, platterD, platterD);
    }

    // Record contact shadow on mat/platter.
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.beginPath();
    ctx.arc(
        platterCx - VINYL_SCENE_LIGHT.x * recordD * 0.008,
        platterCy - VINYL_SCENE_LIGHT.y * recordD * 0.008,
        recordD / 2,
        0,
        Math.PI * 2,
    );
    ctx.fill();

    if (input.bake.vinyl) {
        ctx.drawImage(input.bake.vinyl, platterCx - recordD / 2, platterCy - recordD / 2, recordD, recordD);
    }

    // Rotating dust + label.
    ctx.save();
    ctx.translate(platterCx, platterCy);
    ctx.rotate(radians);
    if (input.bake.spin) {
        ctx.drawImage(input.bake.spin, -recordD * 0.48, -recordD * 0.48, recordD * 0.96, recordD * 0.96);
    }
    const labelD = recordD * VINYL_LABEL_DIAMETER_RATIO;
    ctx.translate(recordD * 0.0035, recordD * 0.0015);
    ctx.beginPath();
    ctx.arc(0, 0, labelD / 2, 0, Math.PI * 2);
    ctx.clip();
    if (input.cover) {
        ctx.filter = 'saturate(0.94) contrast(0.96) brightness(0.97)';
        drawCoverFill(ctx, input.cover, -labelD / 2, -labelD / 2, labelD);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = 'rgb(87, 28, 19)';
        ctx.fillRect(-labelD / 2, -labelD / 2, labelD, labelD);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(0.6, labelD * 0.006);
    ctx.beginPath();
    ctx.arc(0, 0, labelD * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.40)';
    ctx.lineWidth = Math.max(0.8, labelD * 0.01);
    ctx.beginPath();
    ctx.arc(0, 0, labelD * 0.5 - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Light dust on mat edge (optional texture).
    if (textures.dust) {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.04;
        ctx.beginPath();
        ctx.arc(platterCx, platterCy, matOuter, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(textures.dust, platterCx - matOuter, platterCy - matOuter, matOuter * 2, matOuter * 2);
        ctx.restore();
    }

    drawTurntableHardwareOverlayForLayout(ctx, layout);
};
