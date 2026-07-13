import React, { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, MonetAudioStyle, Theme } from '../../../types';
import { colorWithAlpha, mixColors } from '../colorMix';

// src/components/visualizer/monet/AudioOverlay.tsx
// Monet bottom audio rail: mirrored bars / ribbon with beat glow, canvas-only (no per-frame React state).
interface AudioOverlayProps {
    audioPower: AudioBands['bass'];
    audioBands: AudioBands;
    theme: Theme;
    mode: MonetAudioStyle;
    beatPulse?: MotionValue<number>;
    staticMode?: boolean;
    isPreviewMode?: boolean;
}

const BAR_COUNT = 56;
const MIN_RAW_SPECTRUM_BIN = 6;

const buildSpectrumAnchors = (bands: number[]) => {
    const [bass, lowMid, mid, vocal, treble] = bands;
    return [
        bass * 1.08,
        bass * 0.96,
        bass * 0.74 + lowMid * 0.26,
        lowMid,
        lowMid * 0.58 + mid * 0.42,
        mid,
        mid * 0.42 + vocal * 0.58,
        vocal,
        vocal * 0.48 + treble * 0.52,
        treble,
        treble * 0.82,
    ].map(value => Math.max(0, Math.min(1, value)));
};

const sampleSpectrumProfile = (bands: number[], normalizedIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(1, normalizedIndex));
    const anchors = buildSpectrumAnchors(bands);
    const logIndex = Math.log10(1 + clampedIndex * 9);
    const scaledIndex = logIndex * (anchors.length - 1);
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(lowerIndex + 1, anchors.length - 1);
    const interpolation = scaledIndex - lowerIndex;
    const lowerValue = anchors[lowerIndex] ?? 0;
    const upperValue = anchors[upperIndex] ?? lowerValue;
    const interpolated = lowerValue + (upperValue - lowerValue) * interpolation;

    const contour =
        0.92 +
        Math.sin(clampedIndex * Math.PI * 3.4 - Math.PI * 0.3) * 0.08 +
        Math.sin(clampedIndex * Math.PI * 9.2 + Math.PI * 0.2) * 0.035;
    return Math.max(0, Math.min(1, interpolated * contour));
};

const sampleRawSpectrumProfile = (rawSpectrum: Uint8Array, normalizedIndex: number) => {
    if (rawSpectrum.length <= MIN_RAW_SPECTRUM_BIN) {
        return 0;
    }

    const clampedIndex = Math.max(0, Math.min(1, normalizedIndex));
    const usableBinCount = Math.max(1, rawSpectrum.length - MIN_RAW_SPECTRUM_BIN);
    const mappedIndex = Math.expm1(clampedIndex * Math.log(usableBinCount + 1));
    const centerIndex = MIN_RAW_SPECTRUM_BIN + mappedIndex;
    const edgeSoftness = 1 - Math.abs(clampedIndex - 0.5) * 2;
    const windowRadius = Math.max(1, Math.round(5 - edgeSoftness * 3));
    const start = Math.max(MIN_RAW_SPECTRUM_BIN, Math.floor(centerIndex - windowRadius));
    const end = Math.min(rawSpectrum.length - 1, Math.ceil(centerIndex + windowRadius));

    let weightedSum = 0;
    let weightTotal = 0;
    for (let index = start; index <= end; index += 1) {
        const distance = Math.abs(index - centerIndex);
        const weight = Math.max(0.1, 1 - distance / (windowRadius + 1));
        weightedSum += rawSpectrum[index] * weight;
        weightTotal += weight;
    }

    const averaged = weightTotal > 0 ? weightedSum / weightTotal : 0;
    const noiseFloor = 16 + (1 - clampedIndex) * 12;
    const normalized = Math.max(0, Math.min(1, (averaged - noiseFloor) / (255 - noiseFloor)));
    const power = 1.8 + (1 - clampedIndex) * 0.4;
    const processed = Math.pow(normalized, power);
    const lowFrequencyCompensation = 0.52 + clampedIndex * 0.62;
    const presenceLift = 0.92 + Math.sqrt(clampedIndex) * 0.14;
    return Math.max(0, Math.min(1, processed * lowFrequencyCompensation * presenceLift));
};

const roundRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
) => {
    const r = Math.min(radius, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const drawStaticBars = (context: CanvasRenderingContext2D, width: number, height: number, theme: Theme, mode: MonetAudioStyle) => {
    context.clearRect(0, 0, width, height);
    const baseline = height * 0.58;
    const primary = theme.primaryColor;
    const tip = mixColors(primary, '#ffffff', 0.45);

    if (mode === 'line') {
        const points: { x: number; y: number }[] = [];
        for (let index = 0; index < BAR_COUNT; index += 1) {
            const x = (index / (BAR_COUNT - 1)) * width;
            const spectrumIndex = index / (BAR_COUNT - 1);
            const envelope = Math.sin(spectrumIndex * Math.PI);
            const val = 0.18 + (Math.sin(index * 0.35) * 0.5 + 0.5) * 0.55;
            const y = baseline - baseline * val * envelope * 0.92;
            points.push({ x, y });
        }

        const drawCurve = (ctx: CanvasRenderingContext2D) => {
            if (points.length === 0) return;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        };

        context.beginPath();
        drawCurve(context);
        context.lineTo(width, baseline);
        context.lineTo(0, baseline);
        context.closePath();
        const fillGradient = context.createLinearGradient(0, 0, 0, baseline);
        fillGradient.addColorStop(0, colorWithAlpha(tip, 0.42));
        fillGradient.addColorStop(1, colorWithAlpha(primary, 0.0));
        context.fillStyle = fillGradient;
        context.fill();

        context.beginPath();
        drawCurve(context);
        context.strokeStyle = colorWithAlpha(tip, 0.96);
        context.lineWidth = 2.4;
        context.lineCap = 'round';
        context.stroke();
        return;
    }

    const gap = width / BAR_COUNT;
    const barWidth = Math.max(2.2, gap * 0.42);
    for (let index = 0; index < BAR_COUNT; index += 1) {
        const spectrumIndex = index / (BAR_COUNT - 1);
        const envelope = Math.sin(spectrumIndex * Math.PI);
        const val = 0.16 + (Math.sin(index * 0.35) * 0.5 + 0.5) * 0.58;
        const barHeight = baseline * (0.06 + val * 0.88 * envelope);
        const x = index * gap + (gap - barWidth) * 0.5;
        const mirror = barHeight * 0.42;
        const barGradient = context.createLinearGradient(0, baseline - barHeight, 0, baseline);
        barGradient.addColorStop(0, colorWithAlpha(tip, 0.98));
        barGradient.addColorStop(0.55, colorWithAlpha(primary, 0.92));
        barGradient.addColorStop(1, colorWithAlpha(primary, 0.55));
        context.fillStyle = barGradient;
        roundRectPath(context, x, baseline - barHeight, barWidth, barHeight, barWidth * 0.45);
        context.fill();

        const mirrorGradient = context.createLinearGradient(0, baseline, 0, baseline + mirror);
        mirrorGradient.addColorStop(0, colorWithAlpha(primary, 0.34));
        mirrorGradient.addColorStop(1, colorWithAlpha(primary, 0));
        context.fillStyle = mirrorGradient;
        roundRectPath(context, x, baseline, barWidth, mirror, barWidth * 0.35);
        context.fill();
    }
};

const AudioOverlay: React.FC<AudioOverlayProps> = ({
    audioPower,
    audioBands,
    theme,
    mode,
    beatPulse,
    staticMode = false,
    isPreviewMode = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        let frameId = 0;
        let canvasWidth = 0;
        let canvasHeight = 0;
        let phase = 0;
        let lastFrameMs = performance.now();
        const peakHolds = new Float32Array(BAR_COUNT);

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
            const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
            canvasWidth = rect.width;
            canvasHeight = rect.height;
            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
            }
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = () => {
            const width = canvasWidth;
            const height = canvasHeight;
            if (width <= 0 || height <= 0) {
                return;
            }

            const now = performance.now();
            const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameMs) / 1000));
            lastFrameMs = now;

            context.clearRect(0, 0, width, height);
            const bands = [
                audioBands.bass.get() / 255,
                audioBands.lowMid.get() / 255,
                audioBands.mid.get() / 255,
                audioBands.vocal.get() / 255,
                audioBands.treble.get() / 255,
            ];
            const rawSpectrum = audioBands.spectrum?.get() ?? new Uint8Array(0);
            const hasRawSpectrum = rawSpectrum.length > MIN_RAW_SPECTRUM_BIN;
            const energy = Math.min(1, Math.max(0.08, audioPower.get() / 255));
            const beat = Math.max(0, Math.min(1, beatPulse?.get() ?? 0));
            const bass = bands[0] ?? 0;
            const vocal = bands[3] ?? 0;
            const phaseSpeed = 1.6 + energy * 4.2 + beat * 7.5 + bass * 2.4;
            phase += dt * phaseSpeed;

            const primary = theme.primaryColor;
            const tip = mixColors(primary, '#ffffff', 0.38 + beat * 0.22);
            const baseline = height * 0.58;
            const upperRoom = baseline;
            const lowerRoom = height - baseline;

            // Soft floor wash so the rail reads as a stage element, not a thin strip.
            const floorWash = context.createLinearGradient(0, baseline - upperRoom * 0.35, 0, height);
            floorWash.addColorStop(0, colorWithAlpha(primary, 0));
            floorWash.addColorStop(0.45, colorWithAlpha(primary, 0.06 + beat * 0.05));
            floorWash.addColorStop(1, colorWithAlpha(primary, 0));
            context.fillStyle = floorWash;
            context.fillRect(0, 0, width, height);

            if (mode === 'line') {
                const points: { x: number; y: number }[] = [];
                for (let index = 0; index < BAR_COUNT; index += 1) {
                    const x = (index / (BAR_COUNT - 1)) * width;
                    const spectrumIndex = index / (BAR_COUNT - 1);
                    const band = hasRawSpectrum
                        ? sampleRawSpectrumProfile(rawSpectrum, spectrumIndex)
                        : sampleSpectrumProfile(bands, spectrumIndex);
                    const wave =
                        Math.sin(index * 0.24 + phase * 0.85) * (0.06 + beat * 0.05) +
                        Math.sin(index * 0.68 + phase * 0.52) * (0.035 + vocal * 0.03);
                    const beatKick = beat * (0.1 + Math.sin(index * 0.31 + phase * 1.4) * 0.05);
                    const envelope = Math.sin(spectrumIndex * Math.PI);
                    const amplitude = Math.min(1, energy * 0.08 + band * 0.9 + wave + beatKick);
                    const y = baseline - Math.max(0, upperRoom * amplitude * envelope * 0.96);
                    points.push({ x, y });
                    peakHolds[index] = Math.max(peakHolds[index] * Math.pow(0.25, dt), amplitude * envelope);
                }

                const drawCurve = (ctx: CanvasRenderingContext2D) => {
                    if (points.length === 0) return;
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 0; i < points.length - 1; i++) {
                        const xc = (points[i].x + points[i + 1].x) / 2;
                        const yc = (points[i].y + points[i + 1].y) / 2;
                        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                    }
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                };

                context.save();
                context.shadowColor = colorWithAlpha(tip, 0.55 + beat * 0.35);
                context.shadowBlur = 14 + beat * 18;

                context.beginPath();
                drawCurve(context);
                context.lineTo(width, baseline);
                context.lineTo(0, baseline);
                context.closePath();
                const fillGradient = context.createLinearGradient(0, 0, 0, baseline);
                fillGradient.addColorStop(0, colorWithAlpha(tip, 0.38 + beat * 0.18));
                fillGradient.addColorStop(0.65, colorWithAlpha(primary, 0.18));
                fillGradient.addColorStop(1, colorWithAlpha(primary, 0.0));
                context.fillStyle = fillGradient;
                context.fill();

                context.beginPath();
                drawCurve(context);
                context.strokeStyle = colorWithAlpha(tip, 0.98);
                context.lineWidth = 2.6 + beat * 1.4;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.stroke();
                context.restore();

                // Mirrored ghost ribbon under the baseline.
                context.save();
                context.beginPath();
                if (points.length > 0) {
                    context.moveTo(points[0].x, baseline + (baseline - points[0].y) * 0.45);
                    for (let i = 0; i < points.length - 1; i++) {
                        const y0 = baseline + (baseline - points[i].y) * 0.45;
                        const y1 = baseline + (baseline - points[i + 1].y) * 0.45;
                        const xc = (points[i].x + points[i + 1].x) / 2;
                        const yc = (y0 + y1) / 2;
                        context.quadraticCurveTo(points[i].x, y0, xc, yc);
                    }
                    context.lineTo(points[points.length - 1].x, baseline + (baseline - points[points.length - 1].y) * 0.45);
                }
                context.strokeStyle = colorWithAlpha(primary, 0.28 + beat * 0.12);
                context.lineWidth = 1.6;
                context.stroke();
                context.restore();
            } else {
                const gap = width / BAR_COUNT;
                const barWidth = Math.max(2.4, gap * 0.46);
                context.lineCap = 'round';

                for (let index = 0; index < BAR_COUNT; index += 1) {
                    const spectrumIndex = index / (BAR_COUNT - 1);
                    const band = hasRawSpectrum
                        ? sampleRawSpectrumProfile(rawSpectrum, spectrumIndex)
                        : sampleSpectrumProfile(bands, spectrumIndex);
                    const pulse = Math.sin(index * 0.45 + phase * 1.15) * 0.5 + 0.5;
                    const beatKick = beat * (0.12 + Math.sin(index * 0.38 + phase * 1.8) * 0.07);
                    const envelope = Math.sin(spectrumIndex * Math.PI);
                    const amplitude = Math.min(
                        1,
                        energy * 0.08 + band * 0.9 + pulse * 0.04 + beatKick,
                    );
                    const shaped = amplitude * envelope;
                    peakHolds[index] = Math.max(peakHolds[index] * Math.pow(0.18, dt), shaped);

                    const barHeight = Math.max(2, upperRoom * (0.05 + shaped * 0.95));
                    const mirrorHeight = Math.min(lowerRoom * 0.92, barHeight * (0.38 + beat * 0.08));
                    const x = index * gap + (gap - barWidth) * 0.5;

                    context.save();
                    context.shadowColor = colorWithAlpha(tip, 0.35 + beat * 0.4 + shaped * 0.2);
                    context.shadowBlur = 8 + beat * 14 + shaped * 6;

                    const barGradient = context.createLinearGradient(0, baseline - barHeight, 0, baseline);
                    barGradient.addColorStop(0, colorWithAlpha(tip, 0.98));
                    barGradient.addColorStop(0.45, colorWithAlpha(primary, 0.94));
                    barGradient.addColorStop(1, colorWithAlpha(primary, 0.5));
                    context.fillStyle = barGradient;
                    roundRectPath(context, x, baseline - barHeight, barWidth, barHeight, barWidth * 0.48);
                    context.fill();
                    context.restore();

                    const mirrorGradient = context.createLinearGradient(0, baseline, 0, baseline + mirrorHeight);
                    mirrorGradient.addColorStop(0, colorWithAlpha(primary, 0.32 + beat * 0.1));
                    mirrorGradient.addColorStop(1, colorWithAlpha(primary, 0));
                    context.fillStyle = mirrorGradient;
                    roundRectPath(context, x, baseline, barWidth, mirrorHeight, barWidth * 0.35);
                    context.fill();

                    // Peak hold spark above the bar.
                    const peakY = baseline - upperRoom * (0.05 + peakHolds[index] * 0.95) - 3;
                    context.fillStyle = colorWithAlpha(tip, 0.55 + beat * 0.25);
                    context.beginPath();
                    context.arc(x + barWidth * 0.5, peakY, Math.max(1.1, barWidth * 0.28), 0, Math.PI * 2);
                    context.fill();
                }
            }

            // Fade the rail into the stage on the right so it feels grounded, not boxed.
            const edgeFade = context.createLinearGradient(width * 0.72, 0, width, 0);
            edgeFade.addColorStop(0, 'rgba(0,0,0,0)');
            edgeFade.addColorStop(1, 'rgba(0,0,0,1)');
            context.globalCompositeOperation = 'destination-out';
            context.fillStyle = edgeFade;
            context.fillRect(width * 0.72, 0, width * 0.28, height);
            context.globalCompositeOperation = 'source-over';
        };

        const handleResize = () => {
            resizeCanvas();
            if ((staticMode || isPreviewMode) && canvasWidth > 0 && canvasHeight > 0) {
                drawStaticBars(context, canvasWidth, canvasHeight, theme, mode);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleResize);

        if (staticMode || isPreviewMode) {
            if (canvasWidth > 0 && canvasHeight > 0) {
                drawStaticBars(context, canvasWidth, canvasHeight, theme, mode);
            }
            return () => {
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('fullscreenchange', handleResize);
            };
        }

        const loop = () => {
            draw();
            frameId = window.requestAnimationFrame(loop);
        };

        loop();
        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleResize);
        };
    }, [audioBands, audioPower, beatPulse, isPreviewMode, mode, staticMode, theme]);

    return <canvas ref={canvasRef} className="h-full w-full" />;
};

export default AudioOverlay;
