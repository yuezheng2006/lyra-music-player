// src/components/visualizer/geometric/mineradio/lyrics/lyricCanvasHelpers.ts
// Canvas text measurement helpers for Mineradio stage lyrics.

const clampRange = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type LyricFontStyle = {
    fontFamily: string;
    fontWeight: number;
    letterSpacing: number;
    lineHeight: number;
};

export const DEFAULT_LYRIC_FONT_STYLE: LyricFontStyle = {
    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
};

export const lyricFontCss = (fontSize: number, style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE) =>
    `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;

const letterSpacingPx = (fontSize: number, style: LyricFontStyle) =>
    clampRange(style.letterSpacing, -0.04, 0.18) * Math.max(1, fontSize);

const measureTextWithLetterSpacing = (
    ctx: CanvasRenderingContext2D,
    text: string,
    spacing: number,
) => {
    if (!spacing || text.length < 2) return ctx.measureText(text).width;
    const chars = Array.from(text);
    let width = 0;
    for (let index = 0; index < chars.length; index += 1) {
        width += ctx.measureText(chars[index]).width;
        if (index < chars.length - 1) width += spacing;
    }
    return Math.max(1, width);
};

export const lyricMeasureText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE,
) => measureTextWithLetterSpacing(ctx, text, letterSpacingPx(fontSize, style));

const drawTextWithLetterSpacing = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    spacing: number,
    stroke: boolean,
) => {
    if (!spacing || text.length < 2) {
        if (stroke) ctx.strokeText(text, x, y);
        else ctx.fillText(text, x, y);
        return;
    }
    const chars = Array.from(text);
    const align = ctx.textAlign || 'left';
    const width = measureTextWithLetterSpacing(ctx, text, spacing);
    let start = x;
    if (align === 'center') start = x - width / 2;
    else if (align === 'right' || align === 'end') start = x - width;
    ctx.textAlign = 'left';
    let cursor = start;
    for (let index = 0; index < chars.length; index += 1) {
        if (stroke) ctx.strokeText(chars[index], cursor, y);
        else ctx.fillText(chars[index], cursor, y);
        cursor += ctx.measureText(chars[index]).width + (index < chars.length - 1 ? spacing : 0);
    }
    ctx.textAlign = align;
};

export const lyricFillText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE,
) => drawTextWithLetterSpacing(ctx, text, x, y, letterSpacingPx(fontSize, style), false);

export const lyricStrokeText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE,
) => drawTextWithLetterSpacing(ctx, text, x, y, letterSpacingPx(fontSize, style), true);

export const lyricLineHeightFactor = (style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE) =>
    clampRange(style.lineHeight, 0.86, 1.35);
