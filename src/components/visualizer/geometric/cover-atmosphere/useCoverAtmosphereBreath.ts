import { useCallback, useEffect, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import {
    COVER_ATMOSPHERE_BREATH_EPSILON,
    resolveCoverAtmosphereBreathOpacity,
    resolveCoverAtmosphereWashOpacity,
} from '../../../../utils/visualizer/coverAtmosphereBreathMath';

// src/components/visualizer/geometric/cover-atmosphere/useCoverAtmosphereBreath.ts
// Coalesce analyser ticks onto one RAF; write wash opacity only when it actually moves.

type UseCoverAtmosphereBreathParams = {
    energy: MotionValue<number>;
    power: MotionValue<number>;
    playing: boolean;
};

export const useCoverAtmosphereBreath = ({
    energy,
    power,
    playing,
}: UseCoverAtmosphereBreathParams) => {
    const washRef = useRef<HTMLDivElement>(null);
    const playingRef = useRef(playing);
    playingRef.current = playing;
    const rafRef = useRef<number | null>(null);
    const lastWashRef = useRef(-1);

    const applyBreath = useCallback(() => {
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const coverOpacity = resolveCoverAtmosphereBreathOpacity(
                energy.get(),
                power.get(),
                playingRef.current,
            );
            const washOpacity = resolveCoverAtmosphereWashOpacity(coverOpacity);
            if (Math.abs(washOpacity - lastWashRef.current) < COVER_ATMOSPHERE_BREATH_EPSILON) {
                return;
            }
            lastWashRef.current = washOpacity;
            if (washRef.current) {
                washRef.current.style.opacity = String(washOpacity);
            }
        });
    }, [energy, power]);

    useEffect(() => {
        applyBreath();
        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [applyBreath, playing]);

    useMotionValueEvent(energy, 'change', applyBreath);
    useMotionValueEvent(power, 'change', applyBreath);

    return washRef;
};
