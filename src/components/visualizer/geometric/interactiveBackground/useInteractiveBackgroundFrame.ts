import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { Interactive3dSceneTuning, Theme } from '../../../../types';
import { resolvePresentationBeatPulse } from '../../../../utils/atmosphere/rhythmPresentation';
import { subscribeGeometricCanvasFrame } from '../geometricCanvasRuntime';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import {
    type GeometricQualityProfile,
    resolveGeometricQualityProfile,
} from '../geometricQuality';
import { buildInteractiveBackgroundPalette } from './buildInteractiveBackgroundPalette';
import { useInteractiveBackgroundRegistry } from './InteractiveBackgroundContext';
import {
    createInteractiveBackgroundCompositeState,
    type InteractiveBackgroundCompositeState,
} from './types';

// src/components/visualizer/geometric/interactiveBackground/useInteractiveBackgroundFrame.ts
// Shared RAF loop that advances and draws all registered interactive background effects.

type UseInteractiveBackgroundFrameParams = {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    theme: Theme;
    paused: boolean;
    enabled?: boolean;
    beatPulse?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    bassLevel?: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    enableBeatBursts?: boolean;
    qualityProfile?: GeometricQualityProfile;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
};

export const useInteractiveBackgroundFrame = ({
    canvasRef,
    theme,
    paused,
    enabled = true,
    beatPulse,
    cinemaScale,
    cameraPunch,
    atmosphereEnergy,
    bassLevel,
    pointerX,
    pointerY,
    enableBeatBursts = true,
    qualityProfile,
    interactive3dSceneTuning,
}: UseInteractiveBackgroundFrameParams) => {
    const { getHandles } = useInteractiveBackgroundRegistry();
    const stateRef = useRef<InteractiveBackgroundCompositeState>(createInteractiveBackgroundCompositeState());
    const profileRef = useRef<GeometricQualityProfile>(
        qualityProfile ?? resolveGeometricQualityProfile(),
    );
    const startTsRef = useRef(performance.now());

    useEffect(() => {
        profileRef.current = qualityProfile ?? resolveGeometricQualityProfile();
    }, [qualityProfile]);

    useEffect(() => {
        if (!enabled) return undefined;

        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const profile = profileRef.current;
            const dpr = Math.min(
                profile.devicePixelRatioCap,
                Math.max(1, window.devicePixelRatio || 1),
            );
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            stateRef.current.beatBurst.particles = [];
            stateRef.current.bassRipple.ripples = [];
            getHandles().forEach((handle) => {
                handle.onResize?.(stateRef.current, rect.width, rect.height, profile);
            });
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);

        stateRef.current.palette = buildInteractiveBackgroundPalette(
            theme.primaryColor,
            theme.secondaryColor,
            theme.accentColor,
        );

        const unsubscribe = subscribeGeometricCanvasFrame(({ timestamp, dt, hidden, frameIndex }) => {
            const profile = profileRef.current;
            if (hidden) return;
            if (profile.frameSkip > 1 && frameIndex % profile.frameSkip !== 0) return;

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (width <= 0 || height <= 0) return;

            const palette = stateRef.current.palette ?? buildInteractiveBackgroundPalette(
                theme.primaryColor,
                theme.secondaryColor,
                theme.accentColor,
            );
            const rawBeatPulse = beatPulse?.get() ?? 0;
            const bassLevelValue = bassLevel?.get() ?? 0;
            const inputs = {
                now: (timestamp - startTsRef.current) * 0.001,
                width,
                height,
                beatPulse: resolvePresentationBeatPulse(rawBeatPulse, bassLevelValue),
                cinemaScale: cinemaScale?.get() ?? 0.82,
                cameraPunch: cameraPunch?.get() ?? 0,
                atmosphereEnergy: atmosphereEnergy?.get() ?? 0.42,
                bassLevel: bassLevel?.get() ?? 0,
                pointerX: pointerX.get(),
                pointerY: pointerY.get(),
                paused,
                visualPreset: normalizeInteractive3dVisualPreset(interactive3dSceneTuning?.visualPreset),
                rhythmIntensity: interactive3dSceneTuning?.rhythmIntensity ?? 0.85,
            };
            const effectiveProfile = enableBeatBursts
                ? profile
                : { ...profile, enableBeatBursts: false };
            const handles = getHandles();

            handles.forEach((handle) => {
                handle.advance?.(stateRef.current, inputs, effectiveProfile, dt);
            });

            context.clearRect(0, 0, width, height);
            handles.forEach((handle) => {
                handle.draw(context, stateRef.current, inputs, palette);
            });
        });

        return () => {
            observer.disconnect();
            unsubscribe();
        };
    }, [
        atmosphereEnergy,
        bassLevel,
        beatPulse,
        cameraPunch,
        canvasRef,
        cinemaScale,
        enableBeatBursts,
        getHandles,
        interactive3dSceneTuning?.rhythmIntensity,
        interactive3dSceneTuning?.visualPreset,
        paused,
        pointerX,
        pointerY,
        theme.accentColor,
        theme.primaryColor,
        theme.secondaryColor,
        enabled,
    ]);
};
