import * as THREE from 'three';
import {
    lyricFillText,
    lyricFontCss,
    lyricLineHeightFactor,
    lyricMeasureText,
    type LyricFontStyle,
} from './lyricCanvasHelpers';
import { wrapLyricLines } from './wrapLyricLines';

// src/components/visualizer/geometric/mineradio/lyrics/makeLyricMask.ts
// Builds alpha mask textures for Mineradio WebGL stage lyrics.

export type LyricMask = {
    texture: THREE.CanvasTexture;
    width: number;
    height: number;
    textWidth: number;
    textHeight: number;
    fontSize: number;
    lineHeight: number;
    lineCount: number;
    lines: string[];
    fitScaleX: number;
    textMin: number;
    textMax: number;
};

export type MakeLyricMaskOptions = {
    immersive?: boolean;
};

const STAGE_LYRIC_MAX_LINES = 2;
const MASK_WIDTH = 2048;
const MASK_HEIGHT = 512;
const MIN_FONT_SIZE = 28;
const START_FONT_SIZE = 128;
const IMMERSIVE_START_FONT_SIZE = 168;
/** Horizontal padding inside the mask so glyphs never sit on the texture edge. */
const MASK_EDGE_PADDING_PX = 280;
const IMMERSIVE_MASK_EDGE_PADDING_PX = 160;
/** Hard floor for horizontal squash after wrapping + font shrink. */
const MIN_FIT_SCALE_X = 0.5;

export const makeLyricMask = (
    text: string,
    renderer: THREE.WebGLRenderer,
    style?: LyricFontStyle,
    options: MakeLyricMaskOptions = {},
): LyricMask => {
    const immersive = Boolean(options.immersive);
    const edgePadding = immersive ? IMMERSIVE_MASK_EDGE_PADDING_PX : MASK_EDGE_PADDING_PX;
    const startFontSize = immersive ? IMMERSIVE_START_FONT_SIZE : START_FONT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = MASK_WIDTH;
    canvas.height = MASK_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Lyric mask canvas unavailable');
    }

    const maxWidth = MASK_WIDTH - edgePadding * 2;
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    let fontSize = startFontSize;
    let lines = [normalized];
    let widest = 1;

    for (; fontSize >= MIN_FONT_SIZE; fontSize -= 4) {
        const wrapped = wrapLyricLines(
            ctx,
            normalized,
            fontSize,
            maxWidth,
            STAGE_LYRIC_MAX_LINES,
            style,
        );
        lines = wrapped.lines;
        widest = wrapped.widest;
        if (widest <= maxWidth) break;
    }

    ctx.font = lyricFontCss(fontSize, style);
    if (!lines.length) lines = [''];
    widest = Math.max(1, ...lines.map(line => lyricMeasureText(ctx, line, fontSize, style)));

    let width = Math.min(maxWidth, widest);
    const fitScaleX = widest > maxWidth
        ? Math.max(MIN_FIT_SCALE_X, maxWidth / widest)
        : 1;
    if (fitScaleX < 1) width = Math.min(maxWidth, widest * fitScaleX);

    const lineHeight = fontSize * lyricLineHeightFactor(style);
    const blockH = fontSize + (lines.length - 1) * lineHeight;
    const x = MASK_WIDTH / 2;
    const y0 = MASK_HEIGHT / 2 - blockH / 2 + fontSize * 0.82;

    ctx.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';

    for (let index = 0; index < lines.length; index += 1) {
        const y = y0 + index * lineHeight;
        if (fitScaleX < 1) {
            ctx.save();
            ctx.translate(x, 0);
            ctx.scale(fitScaleX, 1);
            lyricFillText(ctx, lines[index], 0, y, fontSize, style);
            ctx.restore();
        } else {
            lyricFillText(ctx, lines[index], x, y, fontSize, style);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() ?? 1);

    return {
        texture,
        width: MASK_WIDTH,
        height: MASK_HEIGHT,
        textWidth: width,
        textHeight: blockH,
        fontSize,
        lineHeight,
        lineCount: lines.length,
        lines,
        fitScaleX,
        textMin: (MASK_WIDTH / 2 - width / 2) / MASK_WIDTH,
        textMax: (MASK_WIDTH / 2 + width / 2) / MASK_WIDTH,
    };
};
