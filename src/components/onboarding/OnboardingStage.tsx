import React, { useEffect, useRef } from 'react';
import { OnboardingStageRuntime } from './onboardingStageRuntime';
import type { OnboardingStageStep } from './onboardingStageTheme';

// src/components/onboarding/OnboardingStage.tsx
// Mounts the premiere WebGL stage behind the onboarding glass UI.

export type OnboardingStageProps = {
    step: OnboardingStageStep;
    reducedMotion: boolean;
    className?: string;
};

export function OnboardingStage({ step, reducedMotion, className }: OnboardingStageProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const runtimeRef = useRef<OnboardingStageRuntime | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        const runtime = new OnboardingStageRuntime();
        runtimeRef.current = runtime;
        runtime.mount(container);
        runtime.setStep(step);
        runtime.setReducedMotion(reducedMotion);
        runtime.start();

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) {
                return;
            }
            runtime.resize(entry.contentRect.width, entry.contentRect.height);
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            runtime.dispose();
            runtimeRef.current = null;
        };
        // Mount once; step/motion sync via separate effects.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        runtimeRef.current?.setStep(step);
    }, [step]);

    useEffect(() => {
        runtimeRef.current?.setReducedMotion(reducedMotion);
    }, [reducedMotion]);

    return (
        <div
            ref={containerRef}
            className={className}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                background:
                    'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(70,90,120,0.28) 0%, rgba(9,9,11,0.92) 55%, #09090b 100%)',
            }}
        />
    );
}
