import { useEffect } from 'react';
import type { Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import type { BeatParticleRuntimeRefs } from './beatParticleTypes';

// src/components/visualizer/atmosphere/useBeatParticleCanvas.ts
// Canvas draw loop for beat-triggered ambient particles.

type UseBeatParticleCanvasParams = BeatParticleRuntimeRefs & {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    theme: Theme;
    paused: boolean;
};

export const useBeatParticleCanvas = ({
    canvasRef,
    theme,
    paused,
    particlesRef,
    energyRef,
}: UseBeatParticleCanvasParams) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);

        let frameRef: number | null = null;
        let lastTs = performance.now();
        const accent = colorWithAlpha(theme.accentColor, 0.9);
        const primary = colorWithAlpha(theme.primaryColor, 0.55);

        const draw = (ts: number) => {
            const dt = Math.min(0.05, (ts - lastTs) / 1000);
            lastTs = ts;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            context.clearRect(0, 0, width, height);

            if (!paused) {
                const nextParticles = [];
                for (const particle of particlesRef.current) {
                    particle.life += dt;
                    if (particle.life >= particle.maxLife) continue;

                    particle.x += particle.vx * dt;
                    particle.y += particle.vy * dt;
                    particle.vy += 18 * dt;
                    particle.vx *= 1 - dt * 0.8;

                    const fade = 1 - particle.life / particle.maxLife;
                    context.beginPath();
                    context.fillStyle = particle.useAccent ? accent : primary;
                    context.globalAlpha = particle.alpha * fade * (0.35 + energyRef.current * 0.5);
                    context.arc(
                        particle.x,
                        particle.y,
                        particle.size * (0.6 + fade * 0.8),
                        0,
                        Math.PI * 2,
                    );
                    context.fill();
                    nextParticles.push(particle);
                }
                particlesRef.current = nextParticles;
            } else {
                particlesRef.current = [];
            }

            context.globalAlpha = 1;
            frameRef = requestAnimationFrame(draw);
        };

        frameRef = requestAnimationFrame(draw);

        return () => {
            observer.disconnect();
            if (frameRef) cancelAnimationFrame(frameRef);
            particlesRef.current = [];
        };
    }, [canvasRef, energyRef, paused, particlesRef, theme.accentColor, theme.primaryColor]);
};
