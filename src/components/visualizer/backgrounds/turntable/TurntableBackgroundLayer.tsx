import React, { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import {
    createTurntableBakeCache,
    drawAlbumCanvasScene,
    loadTurntableTextures,
    type TurntableBakeCache,
    type TurntableTextures,
} from '../../../../utils/visualizer/turntable/drawAlbumCanvasScene';
import {
    createVinylSpinAnchor,
    resolveVinylSpinDegrees,
    shouldReanchorVinylSpin,
} from '../../../../utils/visualizer/turntable/vinylSpinRuntime';
import { resolveTurntableLayout } from '../../../../utils/visualizer/turntable/turntableLayout';

// src/components/visualizer/backgrounds/turntable/TurntableBackgroundLayer.tsx
// Faithful vinylformac AlbumCanvas background: textured table + sleeve + GL vinyl.

type TurntableBackgroundLayerProps = {
    coverUrl?: string | null;
    paused?: boolean;
    playing?: boolean;
    currentTime?: MotionValue<number>;
};

const MAX_SPIN_FPS = 30;

const loadCoverImage = (url: string): Promise<HTMLImageElement | null> => (
    new Promise((resolve) => {
        const tryLoad = (withCors: boolean) => {
            const img = new Image();
            img.decoding = 'async';
            if (withCors) img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                if (withCors) tryLoad(false);
                else resolve(null);
            };
            img.src = url;
        };
        tryLoad(false);
    })
);

const TurntableBackgroundLayer: React.FC<TurntableBackgroundLayerProps> = ({
    coverUrl,
    paused = false,
    playing,
    currentTime,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const texturesRef = useRef<TurntableTextures | null>(null);
    const bakeRef = useRef<TurntableBakeCache | null>(null);
    const coverRef = useRef<HTMLImageElement | null>(null);
    const playingRef = useRef(playing ?? !paused);
    const lastMediaSecRef = useRef(Number.NaN);
    const anchorRef = useRef(createVinylSpinAnchor(0, performance.now()));
    const lastDrawMsRef = useRef(0);

    playingRef.current = playing ?? !paused;

    useEffect(() => {
        let cancelled = false;
        void loadTurntableTextures().then((textures) => {
            if (cancelled) return;
            texturesRef.current = textures;
        });
        bakeRef.current = createTurntableBakeCache(1024);
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        coverRef.current = null;
        if (!coverUrl) return;
        let cancelled = false;
        void loadCoverImage(coverUrl).then((img) => {
            if (cancelled) return;
            coverRef.current = img;
        });
        return () => {
            cancelled = true;
        };
    }, [coverUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let disposed = false;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const w = Math.max(1, Math.floor(parent.clientWidth));
            const h = Math.max(1, Math.floor(parent.clientHeight));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        };

        const drawFrame = (nowMs: number) => {
            if (disposed) return;
            resize();

            const mediaSec = currentTime?.get() ?? 0;
            const isPlaying = playingRef.current;
            if (
                !Number.isFinite(lastMediaSecRef.current)
                || shouldReanchorVinylSpin(lastMediaSecRef.current, mediaSec)
                || (isPlaying && nowMs - anchorRef.current.wallMs > 12_000)
            ) {
                anchorRef.current = createVinylSpinAnchor(mediaSec, nowMs);
            }
            lastMediaSecRef.current = mediaSec;

            const degrees = resolveVinylSpinDegrees({
                playing: isPlaying,
                mediaSec,
                wallMs: nowMs,
                anchor: anchorRef.current,
            });

            if (nowMs - lastDrawMsRef.current < (1000 / MAX_SPIN_FPS) - 1) {
                raf = requestAnimationFrame(drawFrame);
                return;
            }
            lastDrawMsRef.current = nowMs;

            const bake = bakeRef.current;
            const textures = texturesRef.current;
            if (!bake || !textures) {
                raf = requestAnimationFrame(drawFrame);
                return;
            }

            const layout = resolveTurntableLayout(canvas.width, canvas.height);
            drawAlbumCanvasScene(ctx, layout, {
                textures,
                bake,
                cover: coverRef.current,
                degrees,
            });

            raf = requestAnimationFrame(drawFrame);
        };

        raf = requestAnimationFrame(drawFrame);
        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
        };
    }, [currentTime]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden" data-testid="turntable-background-layer">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>
    );
};

export default TurntableBackgroundLayer;
