import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { CoverColorMixTween } from '../../geometric/webgl/coverColorMixTween';
import {
    LATENT_DISSOLVE_GRID_H,
    LATENT_DISSOLVE_GRID_W,
    LATENT_DISSOLVE_MS,
    paintLatentDissolveFrame,
    parseLatentDissolveAccentRgb,
    resolveDissolveLive,
} from '../../../../utils/visualizer/latentBackgroundDissolveMath';

// src/components/visualizer/backgrounds/latent/LatentDissolveOverlay.tsx
// Low-res canvas dissolve flash on cover change; no per-frame React updates.

export type LatentDissolveOverlayHandle = {
    /** Fire a cover-change dissolve using an accent CSS color. */
    trigger: (accentCss: string) => void;
};

type LatentDissolveOverlayProps = {
    enabled?: boolean;
};

const LatentDissolveOverlay = React.forwardRef<LatentDissolveOverlayHandle, LatentDissolveOverlayProps>(
    ({ enabled = true }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const tweenRef = useRef(new CoverColorMixTween());
        const rafRef = useRef(0);
        const dissolveRef = useRef(1);
        const liveRef = useRef(0);
        const accentRef = useRef<[number, number, number]>([80, 180, 255]);
        const imageDataRef = useRef<ImageData | null>(null);

        const paint = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (!imageDataRef.current) {
                imageDataRef.current = ctx.createImageData(LATENT_DISSOLVE_GRID_W, LATENT_DISSOLVE_GRID_H);
            }
            const imageData = imageDataRef.current;
            paintLatentDissolveFrame({
                data: imageData.data,
                width: LATENT_DISSOLVE_GRID_W,
                height: LATENT_DISSOLVE_GRID_H,
                dissolve: dissolveRef.current,
                live: liveRef.current,
                accent: accentRef.current,
            });
            ctx.putImageData(imageData, 0, 0);
            canvas.style.opacity = liveRef.current > 0.001 ? '1' : '0';
        };

        useImperativeHandle(ref, () => ({
            trigger: (accentCss: string) => {
                if (!enabled) return;
                accentRef.current = parseLatentDissolveAccentRgb(accentCss);
                liveRef.current = 1;
                dissolveRef.current = 0;
                tweenRef.current.cancel();
                cancelAnimationFrame(rafRef.current);
                const tick = () => {
                    paint();
                    if (liveRef.current > 0.001) {
                        rafRef.current = requestAnimationFrame(tick);
                    }
                };
                tweenRef.current.start((mix) => {
                    dissolveRef.current = mix;
                    liveRef.current = resolveDissolveLive(mix, true);
                    if (mix >= 1) {
                        liveRef.current = 0;
                        paint();
                    }
                }, LATENT_DISSOLVE_MS);
                rafRef.current = requestAnimationFrame(tick);
            },
        }), [enabled]);

        useEffect(() => () => {
            tweenRef.current.cancel();
            cancelAnimationFrame(rafRef.current);
        }, []);

        return (
            <canvas
                ref={canvasRef}
                width={LATENT_DISSOLVE_GRID_W}
                height={LATENT_DISSOLVE_GRID_H}
                data-testid="latent-dissolve-overlay"
                aria-hidden
                className="absolute inset-0 z-[1] h-full w-full"
                style={{
                    opacity: 0,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    imageRendering: 'pixelated',
                }}
            />
        );
    },
);

LatentDissolveOverlay.displayName = 'LatentDissolveOverlay';

export default LatentDissolveOverlay;
