import { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { useMotionValue, useMotionValueEvent } from 'framer-motion';
import type { EmotionTag } from '../types/moodEngine';
import {
    moodLyricProfileToCssVars,
    resolveMoodLyricProfile,
    type MoodLyricProfile,
} from '../utils/lyrics/moodLyricDirector';

// src/hooks/useMoodLyricCssVars.ts
// Applies discrete MoodLyric CSS vars; continuous beat stays on MotionValues outside React state.

const ENERGY_BUCKET = 0.08;

export interface UseMoodLyricCssVarsParams {
    speakerActive: boolean;
    emotion?: EmotionTag | null;
    bpm?: number;
    atmosphereEnergy?: MotionValue<number> | null;
    targetRef?: React.RefObject<HTMLElement | null>;
}

const bucketEnergy = (value: number) => Math.round(value / ENERGY_BUCKET) * ENERGY_BUCKET;

export const useMoodLyricCssVars = ({
    speakerActive,
    emotion = null,
    bpm = 0,
    atmosphereEnergy = null,
    targetRef,
}: UseMoodLyricCssVarsParams): MoodLyricProfile => {
    const fallbackEnergy = useMotionValue(0.45);
    const energyMv = atmosphereEnergy ?? fallbackEnergy;
    const [energySample, setEnergySample] = useState(() => energyMv.get());
    const signatureRef = useRef('');

    useMotionValueEvent(energyMv, 'change', (latest) => {
        if (!speakerActive) return;
        const next = bucketEnergy(latest);
        setEnergySample((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    });

    const profile = useMemo(
        () => resolveMoodLyricProfile({
            speakerActive,
            emotion,
            energy: energySample,
            bpm,
        }),
        [bpm, emotion, energySample, speakerActive],
    );

    useEffect(() => {
        const el = targetRef?.current;
        if (!el) return;
        signatureRef.current = profile.signature;
        const vars = moodLyricProfileToCssVars(profile);
        Object.entries(vars).forEach(([key, value]) => {
            if (profile.signature === 'off') {
                el.style.removeProperty(key);
            } else {
                el.style.setProperty(key, value);
            }
        });
        if (profile.signature === 'off') {
            el.removeAttribute('data-mood-lyric');
        } else {
            el.setAttribute('data-mood-lyric', profile.enterStyle);
        }
    }, [profile, targetRef]);

    return profile;
};
